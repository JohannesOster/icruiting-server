SELECT form.*, json_agg(items.* ORDER BY row_index ASC) form_items
FROM form
JOIN (SELECT * FROM form_item) as items 
ON items.form_id = form.form_id
WHERE form.form_id = ${form_id}
GROUP BY form.form_id;