import app from './app';

const port = process.env.PORT || 5000;
app.listen(port, () => {
  if (process.env.NODE_ENV === 'development') {
    /* tslint:disable no-console */
    console.log(`Listening: http://localhost:${port}`);
  }
});
