export default defineAppConfig({
  lazyCodeLoading: 'requiredComponents',
  pages: [
    'pages/index/index',
    'pages/split/index',
    'pages/merge/index',
    'pages/compress/index',
    'pages/resize/index',
    'pages/crop/index',
    'pages/frame/index',
    'pages/watermark/index',
    'pages/convert/index',
    'pages/history/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#E66C32',
    navigationBarTitleText: '沐橙图片',
    navigationBarTextStyle: 'white',
    backgroundColor: '#fff7ef'
  },
  permission: {
    'scope.writePhotosAlbum': {
      desc: '用于将处理后的图片保存到相册'
    }
  }
});
