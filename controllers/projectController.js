const router = require('express').Router();
const auth = require('../middleware/auth');

router.get('/', async (req, res) => {
    const db = req.app.get('db');
    try {
        const listing = await db.query('SELECT * FROM projects ORDER BY display_order ASC, id DESC');
        res.json(listing.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', auth, async (req, res) => {
    const db = req.app.get('db');
    const { title, category, is_featured, display_order, images } = req.body;
    try {
        const created = await db.query(
            'INSERT INTO projects (title, category, is_featured, display_order, images) VALUES ($1, $2, $3, $4, $5::jsonb) RETURNING *',
            [title, category, is_featured || false, display_order || 0, JSON.stringify(images || [])]
        );
        res.json(created.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/reorder', auth, async (req, res) => {
    const db = req.app.get('db');
    const { orders } = req.body; // Expects structural configuration: [{ id: 1, display_order: 0 }]
    try {
        await db.query('BEGIN');
        for (const item of orders) {
            await db.query('UPDATE projects SET display_order = $1 WHERE id = $2', [item.display_order, item.id]);
        }
        await db.query('COMMIT');
        res.json({ success: 'Gallery structure configuration reordered successfully.' });
    } catch (err) {
        await db.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', auth, async (req, res) => {
    const db = req.app.get('db');
    const { title, category, is_featured, display_order, images } = req.body;
    try {
        const updated = await db.query(
            'UPDATE projects SET title = $1, category = $2, is_featured = $3, display_order = $4, images = $5::jsonb WHERE id = $6 RETURNING *',
            [title, category, is_featured, display_order, JSON.stringify(images || []), req.params.id]
        );
        res.json(updated.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', auth, async (req, res) => {
    const db = req.app.get('db');
    try {
        await db.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
        res.json({ success: 'Project asset record terminated.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
