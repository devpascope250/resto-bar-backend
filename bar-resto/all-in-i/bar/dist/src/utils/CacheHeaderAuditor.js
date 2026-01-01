"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheHeaderAuditor = void 0;
class CacheHeaderAuditor {
    constructor() {
        this.reports = [];
    }
    auditMiddleware() {
        return (req, res, next) => {
            const originalEnd = res.end.bind(res);
            res.end = (...args) => {
                const report = this.generateReport(req, res);
                this.reports.push(report);
                this.logReport(report);
                return originalEnd(...args);
            };
            next();
        };
    }
    generateReport(req, res) {
        const headers = {
            cacheControl: res.getHeader('Cache-Control'),
            etag: res.getHeader('ETag'),
            expires: res.getHeader('Expires'),
            lastModified: res.getHeader('Last-Modified'),
            pragma: res.getHeader('Pragma'),
            age: res.getHeader('Age'),
        };
        const recommendations = [];
        // Analyze and provide recommendations
        if (!headers.cacheControl) {
            if (req.path.match(/\.(js|css|png|jpg|ico)$/)) {
                recommendations.push('Add Cache-Control: public, max-age=31536000, immutable');
            }
            else if (req.path.startsWith('/api/')) {
                recommendations.push('Consider Cache-Control: no-cache with ETag validation');
            }
        }
        if (headers.cacheControl && headers.cacheControl.includes('no-store')) {
            recommendations.push('no-store prevents any caching. Use no-cache instead for validation.');
        }
        return {
            path: req.path,
            method: req.method,
            timestamp: new Date(),
            headers,
            recommendations,
        };
    }
    logReport(report) {
        console.log(`\n📊 Cache Header Report for ${report.method} ${report.path}`);
        console.log(`   Cache-Control: ${report.headers.cacheControl || '❌ Missing'}`);
        console.log(`   ETag: ${report.headers.etag || '❌ Missing'}`);
        if (report.recommendations.length > 0) {
            console.log('   💡 Recommendations:');
            report.recommendations.forEach(rec => console.log(`     - ${rec}`));
        }
        else {
            console.log('   ✅ Cache headers properly configured');
        }
    }
    getReports() {
        return this.reports;
    }
    generateSummary() {
        const total = this.reports.length;
        const withCacheControl = this.reports.filter(r => r.headers.cacheControl).length;
        const withEtag = this.reports.filter(r => r.headers.etag).length;
        console.log('\n📈 CACHE HEADER SUMMARY');
        console.log(`Total requests analyzed: ${total}`);
        console.log(`With Cache-Control: ${withCacheControl} (${((withCacheControl / total) * 100).toFixed(1)}%)`);
        console.log(`With ETag: ${withEtag} (${((withEtag / total) * 100).toFixed(1)}%)`);
    }
}
exports.CacheHeaderAuditor = CacheHeaderAuditor;
// Usage
