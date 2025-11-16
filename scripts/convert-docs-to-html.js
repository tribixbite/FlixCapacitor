#!/usr/bin/env node

/**
 * Convert Privacy Policy and Terms to HTML for hosting
 *
 * This script converts PRIVACY.md and TERMS.md to styled HTML files
 * that can be hosted on GitHub Pages or any static hosting service.
 */

import { readFileSync, writeFileSync } from 'fs';
import { marked } from 'marked';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// HTML template with dark theme matching FlixCapacitor branding
const createHTMLTemplate = (title, content, lastUpdated) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${title} for FlixCapacitor - Torrent streaming app for Android">
    <title>${title} - FlixCapacitor</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            background: linear-gradient(135deg, #0a0a0a 0%, #1f1f1f 100%);
            color: #ffffff;
            line-height: 1.6;
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
            background: rgba(20, 20, 20, 0.95);
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        }

        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 30px;
            border-bottom: 2px solid #333;
        }

        .logo {
            font-size: 48px;
            margin-bottom: 10px;
        }

        .app-name {
            font-size: 32px;
            font-weight: bold;
            background: linear-gradient(135deg, #e50914 0%, #3b82f6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 10px;
        }

        .last-updated {
            color: #b3b3b3;
            font-size: 14px;
        }

        h1 {
            color: #ffffff;
            font-size: 36px;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid #e50914;
        }

        h2 {
            color: #ffffff;
            font-size: 28px;
            margin-top: 40px;
            margin-bottom: 20px;
            padding-bottom: 8px;
            border-bottom: 2px solid #3b82f6;
        }

        h3 {
            color: #ffffff;
            font-size: 22px;
            margin-top: 30px;
            margin-bottom: 15px;
        }

        p {
            margin-bottom: 15px;
            color: #e5e5e5;
        }

        strong {
            color: #ffffff;
            font-weight: 600;
        }

        ul, ol {
            margin-left: 30px;
            margin-bottom: 20px;
        }

        li {
            margin-bottom: 10px;
            color: #e5e5e5;
        }

        a {
            color: #3b82f6;
            text-decoration: none;
            transition: color 0.2s;
        }

        a:hover {
            color: #60a5fa;
            text-decoration: underline;
        }

        code {
            background: rgba(59, 130, 246, 0.1);
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            color: #60a5fa;
        }

        .footer {
            margin-top: 60px;
            padding-top: 30px;
            border-top: 2px solid #333;
            text-align: center;
            color: #b3b3b3;
            font-size: 14px;
        }

        .footer a {
            color: #3b82f6;
            margin: 0 10px;
        }

        @media (max-width: 768px) {
            .container {
                padding: 20px;
            }

            h1 {
                font-size: 28px;
            }

            h2 {
                font-size: 24px;
            }

            h3 {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">⚡</div>
            <div class="app-name">FlixCapacitor</div>
            <div class="last-updated">Last Updated: ${lastUpdated}</div>
        </div>

        <div class="content">
            ${content}
        </div>

        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} FlixCapacitor. All rights reserved.</p>
            <p>
                <a href="index.html">Home</a> |
                <a href="privacy.html">Privacy Policy</a> |
                <a href="terms.html">Terms of Service</a>
            </p>
        </div>
    </div>
</body>
</html>`;

// Convert Markdown to HTML
function convertMarkdownToHTML(inputFile, outputFile, title) {
    console.log(`Converting ${inputFile} to ${outputFile}...`);

    const inputPath = join(rootDir, inputFile);
    const outputPath = join(rootDir, 'public-docs', outputFile);

    // Read markdown file
    const markdown = readFileSync(inputPath, 'utf-8');

    // Extract last updated date from markdown (looks for "Last Updated:" line)
    const lastUpdatedMatch = markdown.match(/\*\*Last Updated:\*\* (.+)/);
    const lastUpdated = lastUpdatedMatch ? lastUpdatedMatch[1] : new Date().toLocaleDateString();

    // Convert to HTML
    const htmlContent = marked(markdown);

    // Wrap in template
    const fullHTML = createHTMLTemplate(title, htmlContent, lastUpdated);

    // Write to file
    writeFileSync(outputPath, fullHTML, 'utf-8');

    console.log(`✅ Created ${outputFile}`);
}

// Create index.html landing page
function createIndexPage() {
    console.log('Creating index.html...');

    const indexHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="FlixCapacitor - Stream movies, TV shows, anime, and educational content">
    <title>FlixCapacitor - Legal Documents</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            background: linear-gradient(135deg, #0a0a0a 0%, #1f1f1f 100%);
            color: #ffffff;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .container {
            max-width: 600px;
            background: rgba(20, 20, 20, 0.95);
            padding: 60px 40px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
            text-align: center;
        }

        .logo {
            font-size: 72px;
            margin-bottom: 20px;
            animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }

        .app-name {
            font-size: 48px;
            font-weight: bold;
            background: linear-gradient(135deg, #e50914 0%, #3b82f6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 15px;
        }

        .tagline {
            font-size: 20px;
            color: #b3b3b3;
            margin-bottom: 40px;
        }

        .description {
            color: #e5e5e5;
            margin-bottom: 40px;
            line-height: 1.6;
        }

        .links {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        .link-button {
            display: block;
            padding: 18px 30px;
            background: linear-gradient(135deg, #e50914 0%, #3b82f6 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-size: 18px;
            font-weight: 600;
            transition: transform 0.2s, box-shadow 0.2s;
        }

        .link-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
        }

        .link-button.secondary {
            background: rgba(59, 130, 246, 0.1);
            border: 2px solid #3b82f6;
        }

        .footer {
            margin-top: 40px;
            padding-top: 30px;
            border-top: 2px solid #333;
            color: #b3b3b3;
            font-size: 14px;
        }

        @media (max-width: 768px) {
            .container {
                padding: 40px 20px;
            }

            .logo {
                font-size: 56px;
            }

            .app-name {
                font-size: 36px;
            }

            .tagline {
                font-size: 18px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">⚡</div>
        <h1 class="app-name">FlixCapacitor</h1>
        <p class="tagline">Stream Instantly</p>

        <p class="description">
            A modern, mobile-first streaming app built with Capacitor and native torrent support.
            Stream movies, TV shows, anime, and educational content with cloud sync and collections.
        </p>

        <div class="links">
            <a href="privacy.html" class="link-button">Privacy Policy</a>
            <a href="terms.html" class="link-button">Terms of Service</a>
        </div>

        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} FlixCapacitor. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

    const outputPath = join(rootDir, 'public-docs', 'index.html');
    writeFileSync(outputPath, indexHTML, 'utf-8');

    console.log('✅ Created index.html');
}

// Main execution
console.log('🚀 Converting legal documents to HTML...\n');

convertMarkdownToHTML('PRIVACY.md', 'privacy.html', 'Privacy Policy');
convertMarkdownToHTML('TERMS.md', 'terms.html', 'Terms of Service');
createIndexPage();

console.log('\n✅ All HTML files created successfully!');
console.log('\n📁 Files created in public-docs/:');
console.log('   - index.html (landing page)');
console.log('   - privacy.html (Privacy Policy)');
console.log('   - terms.html (Terms of Service)');
console.log('\n🌐 Deploy to GitHub Pages:');
console.log('   1. Commit the public-docs/ folder');
console.log('   2. Push to GitHub');
console.log('   3. Enable GitHub Pages (Settings → Pages)');
console.log('   4. Set source to main branch, /public-docs folder');
console.log('   5. URLs will be: https://[username].github.io/[repo]/privacy.html');
