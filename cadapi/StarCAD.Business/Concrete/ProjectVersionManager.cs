using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using StarCAD.Business.Abstract;
using StarCAD.Business.Security;
using StarCAD.Core.Security;
using StarCAD.Core.Storage;
using StarCAD.Core.Utilities.Results;
using StarCAD.DataAccess.Concrete.EntityFramework;
using StarCAD.Entity.Concrete;
using StarCAD.ViewModel.ProjectVersions;

namespace StarCAD.Business.Concrete;

public class ProjectVersionManager : IProjectVersionService
{
    private readonly StarCADContext _db;
    private readonly IFileStorageService _storage;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitSyncService _unitSync;

    public ProjectVersionManager(
        StarCADContext db,
        IFileStorageService storage,
        ICurrentUserService currentUser,
        IUnitSyncService unitSync)
    {
        _db = db;
        _storage = storage;
        _currentUser = currentUser;
        _unitSync = unitSync;
    }

    public async Task<IDataResult<ProjectVersionCreatedDto>> CreateAsync(
        int projectId, string? label, string rawJson, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(rawJson))
            return new ErrorDataResult<ProjectVersionCreatedDto>("Çizim verisi boş olamaz.", StatusCodes.Status400BadRequest);

        try
        {
            using var _ = JsonDocument.Parse(rawJson);
        }
        catch (JsonException)
        {
            return new ErrorDataResult<ProjectVersionCreatedDto>("Çizim verisi geçerli bir JSON olmalıdır.", StatusCodes.Status400BadRequest);
        }

        if (!string.IsNullOrEmpty(label) && label.Length > 200)
            return new ErrorDataResult<ProjectVersionCreatedDto>("Etiket en fazla 200 karakter olabilir.", StatusCodes.Status400BadRequest);

        var projectVisible = await _db.Projects
            .WhereVisibleTo(_currentUser)
            .AnyAsync(p => p.Id == projectId, cancellationToken);

        if (!projectVisible)
            return new ErrorDataResult<ProjectVersionCreatedDto>("Proje bulunamadı.", StatusCodes.Status404NotFound);

        var bytes = Encoding.UTF8.GetBytes(rawJson);
        var contentHash = Convert.ToHexString(MD5.HashData(bytes)).ToLowerInvariant();
        var objectKey = $"projects/{projectId}/versions/{Guid.NewGuid():N}.json";

        // Bir önceki versiyonla dosya bit-bit aynıysa unit senkronu (upsert/hard-delete) atlanır.
        var previousHash = await _db.ProjectVersions.AsNoTracking()
            .Where(v => v.ProjectId == projectId)
            .OrderByDescending(v => v.CreatedAt)
            .Select(v => v.ContentHash)
            .FirstOrDefaultAsync(cancellationToken);

        await _storage.PutObjectAsync(objectKey, new MemoryStream(bytes), "application/json", cancellationToken);

        var version = new ProjectVersion
        {
            ProjectId = projectId,
            JsonToken = objectKey,
            ContentHash = contentHash,
            Label = string.IsNullOrWhiteSpace(label) ? null : label.Trim(),
            CreatedByUserId = _currentUser.UserId
        };

        // UnitSyncManager, ExecuteUpdateAsync/ExecuteDeleteAsync (SaveChanges'i atlayan bulk
        // operasyonlar) kullanabiliyor — bunları aşağıdaki SaveChangesAsync ile aynı atomik
        // birimde tutmak için açık transaction gerekiyor (bkz. knowledge/unit-sync-hard-delete.md).
        await using var transaction = await _db.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            if (previousHash != contentHash)
                await _unitSync.SyncAsync(projectId, rawJson, cancellationToken);

            _db.ProjectVersions.Add(version);
            await _db.SaveChangesAsync(cancellationToken);

            await transaction.CommitAsync(cancellationToken);
        }
        catch
        {
            // Temizlik istemci gitse bile tamamlanmalı → CancellationToken.None.
            await _storage.RemoveObjectAsync(objectKey, CancellationToken.None);
            throw;
        }

        return new SuccessDataResult<ProjectVersionCreatedDto>(new ProjectVersionCreatedDto
        {
            Id = version.Id,
            ProjectId = version.ProjectId,
            ObjectKey = version.JsonToken,
            Label = version.Label,
            CreatedAt = version.CreatedAt
        }, "Çizim versiyonu kaydedildi.");
    }

    public async Task<IDataResult<List<ProjectVersionListItemDto>>> GetListByProjectAsync(
        int projectId, CancellationToken cancellationToken = default)
    {
        var list = await _db.ProjectVersions.AsNoTracking()
            .WhereVisibleTo(_currentUser)
            .Where(v => v.ProjectId == projectId)
            .OrderByDescending(v => v.CreatedAt)
            .Select(v => new ProjectVersionListItemDto
            {
                Id = v.Id,
                Label = v.Label,
                CreatedAt = v.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return new SuccessDataResult<List<ProjectVersionListItemDto>>(list);
    }

    public async Task<IDataResult<ProjectVersionDownloadDto>> GetDownloadUrlAsync(
        int id, CancellationToken cancellationToken = default)
    {
        var version = await _db.ProjectVersions.AsNoTracking()
            .WhereVisibleTo(_currentUser)
            .FirstOrDefaultAsync(v => v.Id == id, cancellationToken);

        if (version is null)
            return new ErrorDataResult<ProjectVersionDownloadDto>("Çizim versiyonu bulunamadı.", StatusCodes.Status404NotFound);

        if (!await _storage.ObjectExistsAsync(version.JsonToken, cancellationToken))
            return new ErrorDataResult<ProjectVersionDownloadDto>("Çizim dosyası depoda bulunamadı.", StatusCodes.Status404NotFound);

        var url = await _storage.CreatePresignedGetUrlAsync(version.JsonToken, cancellationToken);

        return new SuccessDataResult<ProjectVersionDownloadDto>(new ProjectVersionDownloadDto
        {
            Url = url
        });
    }
}