/**
 * Learning Service
 * Handles fetching, parsing, and managing educational courses from Academic Torrents
 */

import sqliteService from './sqlite-service.js';

class LearningService {
    constructor() {
        this.db = sqliteService;
        this.csvUrl = 'https://academictorrents.com/collection/video-lectures.csv';
        this.providerLogos = {
            'MIT': 'mit-logo.png',
            'Stanford': 'stanford-logo.png',
            'Udemy': 'udemy-logo.png',
            'Coursera': 'coursera-logo.png',
            'Harvard': 'harvard-logo.png',
            'Yale': 'yale-logo.png',
            'Berkeley': 'berkeley-logo.png',
            'Princeton': 'princeton-logo.png',
            'Oxford': 'oxford-logo.png',
            'Cambridge': 'cambridge-logo.png'
        };
        this.defaultLogo = 'education-default.png';
    }

    /**
     * Fetch courses CSV from Academic Torrents
     * @returns {Promise<string>} CSV data
     */
    async fetchCoursesCSV() {
        try {
            console.log('Fetching courses from', this.csvUrl);
            const response = await fetch(this.csvUrl, {
                mode: 'cors',
                headers: {
                    'Accept': 'text/csv'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
            }

            const csvData = await response.text();
            console.log('CSV fetched successfully, size:', csvData.length, 'bytes');
            return csvData;
        } catch (error) {
            console.error('Failed to fetch courses CSV (likely CORS):', error);
            // Return demo data as fallback
            console.log('Using demo data fallback');
            return this.getDemoCSV();
        }
    }

    /**
     * Get demo CSV data as fallback when CORS blocks real API
     * @returns {string} Demo CSV data
     */
    getDemoCSV() {
        return `title,provider,subject_area,description,thumbnail_url,infohash,magnet_link,size_bytes,num_seeders,times_completed,date_added
Introduction to Computer Science,MIT,Computer Science,Learn fundamental concepts of computer science including algorithms and data structures,https://via.placeholder.com/300x200/1f1f1f/e50914?text=MIT+CS,abc123,magnet:?xt=urn:btih:abc123,5368709120,150,2500,2020-01-15
Linear Algebra,MIT,Mathematics,Comprehensive course on linear algebra concepts and applications,https://via.placeholder.com/300x200/1f1f1f/e50914?text=MIT+Math,def456,magnet:?xt=urn:btih:def456,4294967296,120,1800,2019-09-01
Machine Learning,Stanford,Artificial Intelligence,Learn the fundamentals of machine learning and neural networks,https://via.placeholder.com/300x200/1f1f1f/e50914?text=Stanford+ML,ghi789,magnet:?xt=urn:btih:ghi789,8589934592,200,3200,2021-03-10
Physics I: Classical Mechanics,MIT,Physics,Introduction to Newtonian mechanics and conservation laws,https://via.placeholder.com/300x200/1f1f1f/e50914?text=MIT+Physics,jkl012,magnet:?xt=urn:btih:jkl012,6442450944,95,1500,2018-08-20
Introduction to Philosophy,Harvard,Philosophy,Explore fundamental questions about knowledge reality and existence,https://via.placeholder.com/300x200/1f1f1f/e50914?text=Harvard+Phil,mno345,magnet:?xt=urn:btih:mno345,3221225472,80,1200,2020-06-15
Calculus,Khan Academy,Mathematics,Complete calculus course from limits to integration,https://via.placeholder.com/300x200/1f1f1f/e50914?text=Khan+Calculus,pqr678,magnet:?xt=urn:btih:pqr678,2147483648,110,2000,2019-11-05`;
    }

    /**
     * Parse CSV data
     * @param {string} csvData - Raw CSV string
     * @returns {Array<Object>} Parsed course objects
     */
    parseCSV(csvData) {
        if (!csvData) return [];

        const lines = csvData.split('\n');
        const headers = lines[0].split(',');
        const courses = [];

        // Parse each line (skip header)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Simple CSV parsing (handles basic cases)
            const values = this.parseCSVLine(line);
            if (values.length === headers.length) {
                const course = {};
                headers.forEach((header, index) => {
                    course[header] = values[index];
                });

                // Extract provider from title
                const provider = this.extractProvider(course.NAME);
                const subject = this.extractSubject(course.NAME);

                courses.push({
                    title: course.NAME,
                    provider: provider,
                    subject_area: subject,
                    infohash: course.INFOHASH,
                    size_bytes: parseInt(course.SIZEBYTES) || 0,
                    mirrors: parseInt(course.MIRRORS) || 0,
                    downloaders: parseInt(course.DOWNLOADERS) || 0,
                    times_completed: parseInt(course.TIMESCOMPLETED) || 0,
                    date_added: parseInt(course.DATEADDED) || 0,
                    date_modified: parseInt(course.DATEMODIFIED) || 0,
                    magnet_link: this.createMagnetLink(course.INFOHASH, course.NAME),
                    provider_logo: this.getProviderLogo(provider)
                });
            }
        }

        console.log('Parsed', courses.length, 'courses from CSV');
        return courses;
    }

    /**
     * Parse a single CSV line handling quoted values
     * @param {string} line - CSV line
     * @returns {Array<string>} Parsed values
     */
    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }

        values.push(current.trim());
        return values;
    }

    /**
     * Extract provider name from course title
     * @param {string} title - Course title
     * @returns {string} Provider name
     */
    extractProvider(title) {
        if (!title) return 'Unknown';

        // Check for known providers
        const upperTitle = title.toUpperCase();

        if (upperTitle.includes('MIT OCW') || upperTitle.includes('MIT ')) {
            return 'MIT';
        }
        if (upperTitle.includes('STANFORD')) {
            return 'Stanford';
        }
        if (upperTitle.includes('HARVARD')) {
            return 'Harvard';
        }
        if (upperTitle.includes('YALE')) {
            return 'Yale';
        }
        if (upperTitle.includes('BERKELEY')) {
            return 'Berkeley';
        }
        if (upperTitle.includes('UDEMY')) {
            return 'Udemy';
        }
        if (upperTitle.includes('COURSERA')) {
            return 'Coursera';
        }
        if (upperTitle.includes('PRINCETON')) {
            return 'Princeton';
        }
        if (upperTitle.includes('OXFORD')) {
            return 'Oxford';
        }
        if (upperTitle.includes('CAMBRIDGE')) {
            return 'Cambridge';
        }

        return 'Other';
    }

    /**
     * Extract subject area from course title
     * @param {string} title - Course title
     * @returns {string} Subject area
     */
    extractSubject(title) {
        if (!title) return 'General';

        const upperTitle = title.toUpperCase();

        // Science subjects
        if (upperTitle.includes('PHYSICS')) return 'Physics';
        if (upperTitle.includes('CHEMISTRY')) return 'Chemistry';
        if (upperTitle.includes('BIOLOGY')) return 'Biology';
        if (upperTitle.includes('ASTRONOMY')) return 'Astronomy';

        // Math and CS
        if (upperTitle.includes('MATHEMATICS') || upperTitle.includes('CALCULUS') || upperTitle.includes('ALGEBRA')) {
            return 'Mathematics';
        }
        if (upperTitle.includes('COMPUTER SCIENCE') || upperTitle.includes('PROGRAMMING') || upperTitle.includes('CS ')) {
            return 'Computer Science';
        }

        // Engineering
        if (upperTitle.includes('ENGINEERING')) return 'Engineering';

        // Social Sciences
        if (upperTitle.includes('ECONOMICS')) return 'Economics';
        if (upperTitle.includes('PSYCHOLOGY')) return 'Psychology';
        if (upperTitle.includes('SOCIOLOGY')) return 'Sociology';
        if (upperTitle.includes('HISTORY')) return 'History';
        if (upperTitle.includes('PHILOSOPHY')) return 'Philosophy';

        // Arts and Humanities
        if (upperTitle.includes('LITERATURE')) return 'Literature';
        if (upperTitle.includes('ART') || upperTitle.includes('MUSIC')) return 'Arts';

        // Business
        if (upperTitle.includes('BUSINESS') || upperTitle.includes('MANAGEMENT')) return 'Business';

        return 'General';
    }

    /**
     * Create magnet link from infohash and name
     * @param {string} infohash - Torrent infohash
     * @param {string} name - Torrent name
     * @returns {string} Magnet link
     */
    createMagnetLink(infohash, name) {
        const encodedName = encodeURIComponent(name || 'Course');
        return `magnet:?xt=urn:btih:${infohash}&dn=${encodedName}&tr=udp://tracker.openbittorrent.com:80`;
    }

    /**
     * Get provider logo path
     * @param {string} provider - Provider name
     * @returns {string} Logo filename
     */
    getProviderLogo(provider) {
        return this.providerLogos[provider] || this.defaultLogo;
    }

    /**
     * Sync courses from CSV to database
     * @returns {Promise<number>} Number of courses synced
     */
    async syncCourses() {
        try {
            console.log('Starting course sync...');

            // Fetch CSV
            const csvData = await this.fetchCoursesCSV();

            // Parse CSV
            const courses = this.parseCSV(csvData);

            if (courses.length === 0) {
                console.warn('No courses parsed from CSV');
                return 0;
            }

            // Clear existing courses
            await this.db.run('DELETE FROM learning_courses');

            // Insert courses in batches
            let inserted = 0;
            for (const course of courses) {
                try {
                    await this.db.insert('learning_courses', {
                        title: course.title,
                        provider: course.provider,
                        subject_area: course.subject_area,
                        infohash: course.infohash,
                        magnet_link: course.magnet_link,
                        size_bytes: course.size_bytes,
                        mirrors: course.mirrors,
                        downloaders: course.downloaders,
                        times_completed: course.times_completed,
                        date_added: course.date_added,
                        date_modified: course.date_modified,
                        provider_logo: course.provider_logo
                    });
                    inserted++;
                } catch (error) {
                    console.error('Failed to insert course:', course.title, error);
                }
            }

            console.log('Course sync complete:', inserted, 'courses inserted');
            return inserted;
        } catch (error) {
            console.error('Course sync failed:', error);
            throw error;
        }
    }

    /**
     * Get courses with optional filters
     * @param {Object} filters - {provider, subject, search, limit, offset}
     * @returns {Promise<Array<Object>>} Courses
     */
    async getCourses(filters = {}) {
        const {
            provider = null,
            subject = null,
            search = null,
            sorter = null,
            sort = null,
            limit = 50,
            offset = 0
        } = filters;

        // Use sorter if provided, otherwise use sort
        const sortBy = sorter || sort;

        let sql = 'SELECT * FROM learning_courses WHERE 1=1';
        const params = [];

        if (provider && provider !== 'All') {
            sql += ' AND provider = ?';
            params.push(provider);
        }

        if (subject && subject !== 'All') {
            sql += ' AND subject_area = ?';
            params.push(subject);
        }

        if (search) {
            sql += ' AND title LIKE ?';
            params.push(`%${search}%`);
        }

        // Sorting - handle both internal and display names
        const sortMap = {
            'title': 'title ASC',
            'provider': 'provider ASC, title ASC',
            'subject': 'subject_area ASC, title ASC',
            'subject_area': 'subject_area ASC, title ASC',
            'downloaders': 'downloaders DESC, title ASC',
            'size': 'size_bytes DESC, title ASC',
            'date added': 'last_updated DESC, title ASC',
            'date_added': 'last_updated DESC, title ASC',
            'last_updated': 'last_updated DESC, title ASC'
        };
        const sortColumn = sortMap[sortBy] || sortMap[sortBy?.toLowerCase()] || 'times_completed DESC, title ASC';

        sql += ` ORDER BY ${sortColumn}`;
        sql += ' LIMIT ? OFFSET ?';
        params.push(limit, offset);

        return await this.db.query(sql, params);
    }

    /**
     * Get list of providers
     * @returns {Promise<Array<string>>} Provider names
     */
    async getProviders() {
        const sql = 'SELECT DISTINCT provider FROM learning_courses ORDER BY provider';
        const rows = await this.db.query(sql);
        return rows.map(row => row.provider);
    }

    /**
     * Get list of subjects
     * @returns {Promise<Array<string>>} Subject names
     */
    async getSubjects() {
        const sql = 'SELECT DISTINCT subject_area FROM learning_courses ORDER BY subject_area';
        const rows = await this.db.query(sql);
        return rows.map(row => row.subject_area);
    }

    /**
     * Get course count from cache
     * @returns {Promise<number>} Number of courses
     */
    async getCachedCourseCount() {
        const sql = 'SELECT COUNT(*) as count FROM learning_courses';
        const rows = await this.db.query(sql);
        return rows[0]?.count || 0;
    }

    /**
     * Get course by ID
     * @param {number} id - Course ID
     * @returns {Promise<Object|null>} Course data
     */
    async getCourseById(id) {
        return await this.db.findOne('learning_courses', 'id = ?', [id]);
    }

    /**
     * Get total courses count - wrapper for getCachedCourseCount for view compatibility
     * @returns {Promise<number>} Total count of courses
     */
    async getCoursesCount() {
        return this.getCachedCourseCount();
    }
}

// Export as singleton
const learningService = new LearningService();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = learningService;
}

if (typeof window !== 'undefined') {
    window.LearningService = learningService;
}
