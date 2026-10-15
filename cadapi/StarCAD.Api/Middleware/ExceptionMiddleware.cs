using Microsoft.EntityFrameworkCore;


namespace StarCAD.Api.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task Invoke(HttpContext ctx)
    {
        try
        {
            await _next(ctx);
        }
        catch (DbUpdateConcurrencyException)
        {
            ctx.Response.StatusCode = StatusCodes.Status409Conflict;
            ctx.Response.ContentType = "application/json";
            await ctx.Response.WriteAsJsonAsync(new { message = "Kayıt başka biri tarafından güncellendi. Sayfayı yenileyip tekrar deneyin." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Beklenmeyen hata");
            ctx.Response.StatusCode = StatusCodes.Status500InternalServerError;
            ctx.Response.ContentType = "application/json";
            await ctx.Response.WriteAsJsonAsync(new { message = "Beklenmeyen bir hata oluştu." });
        }
        
    }
}