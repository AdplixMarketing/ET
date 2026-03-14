export default function errorHandler(err, _req, res, _next) {
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  } else {
    console.error(err.message);
  }

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error',
  });
}
