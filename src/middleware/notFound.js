export function notFoundHandler(_req, res) {
  return res.status(404).json({
    message: 'Route not found',
    code: 'NOT_FOUND'
  });
}

