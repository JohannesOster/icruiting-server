SELECT
  form.*,
  json_agg(items) form_items
FROM
  form
  JOIN (select * FROM form_item) as items 
  ON items.form_id = form.form_id
WHERE
	form.form_id = ${form_id}
GROUP BY
  form.form_id;