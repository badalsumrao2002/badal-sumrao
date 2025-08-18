const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const pagesDir = path.join(__dirname, '..', '..', 'pages');
const dbPath = path.join(__dirname, '..', 'db.json');

console.log('Starting page migration...');

try {
    // Read all files from the pages directory
    const files = fs.readdirSync(pagesDir).filter(file => file.endsWith('.html'));

    const pagesData = files.map((file, index) => {
        const htmlContent = fs.readFileSync(path.join(pagesDir, file), 'utf8');
        const $ = cheerio.load(htmlContent);

        const title = $('title').text().trim();
        const mainContent = $('main').html();
        const slug = file.replace('.html', '');

        console.log(`Processing: ${file} -> Title: ${title}`);

        return {
            id: index + 1,
            slug: slug,
            title: title,
            metaDescription: '', // Placeholder for meta description
            content: mainContent ? mainContent.trim() : '<p>No content found.</p>'
        };
    });

    // Read the existing database
    const dbRaw = fs.readFileSync(dbPath, 'utf8');
    const db = JSON.parse(dbRaw);

    // Update the pages array
    db.pages = pagesData;

    // Write the updated database back to the file
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    console.log('Migration successful!');
    console.log(`${pagesData.length} pages have been added to the database.`);

} catch (error) {
    console.error('An error occurred during migration:', error);
}
