import app from 'infrastructure/http';

app.listen(5000, () => {
  if (process.env.NODE_ENV === 'development') {
    /* tslint:disable no-console */
    console.log(`Listening: http://localhost:${port}`);
  }
});
