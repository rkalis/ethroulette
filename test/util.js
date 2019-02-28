const getFirstEvent = (_event) => {
  return new Promise((resolve, reject) => {
    _event.once('data', resolve).once('error', reject)
  });
}

module.exports = {
  getFirstEvent
}
