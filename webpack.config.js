 
module.exports = {
  entry: {
    launch: './samples/launch.js',
    first: './samples/first.js'
  },
  output: { 
    path: 'wwwroot/assets', 
    publicPath: 'assets',
    filename: '[name].js' },
  module: {
    loaders: [
      {
        test: /.js?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['es2015', 'react']
        }
      }
    ]
  },
};