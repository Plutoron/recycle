//index.js
const util = require('../../../util/util');
const httpTool = require('../../../comm/script/fetch');
const config = require('../../../comm/script/config');
const msg = require('../../../component/message/message.js');
const app = getApp();
var md5 = require('../../../util/md5');
var jwt = require('../../../util/jwt.js');
/*
  #pragram- lifeCyle

  #pragram- httpRequest

  #pragram- bindChange

  #pragram- bindtap 

  #pragram- private methods
*/
Page({
  data: {
    bannerUrl: 'https://pic.hiweixiu.com/hiweixiu-app/weapp/img/huishoubanner.png',
    showList:[{
      content: '隐私保护',
      imgUrl: 'https://pic.hiweixiu.com/hiweixiu-mobile/img/wxbz.png'
    },{
      content: '优质服务',
      imgUrl: 'https://pic.hiweixiu.com/hiweixiu-mobile/img/hylx-.png'
    },{
      content: '当日到账',
      imgUrl: 'https://pic.hiweixiu.com/hiweixiu-mobile/img/jsyz.png'
    }],
    isShow: false,
    hotDevice: []
  },
  /*
    #pragram- lifeCyle
  */
  onLoad: function () {
    var that = this;
    that.setData({
      showRefresher: false
    })
    wx.showNavigationBarLoading();
  
    wx.showLoading({
      title: '加载中',
      mask: true
    })

    const version = app.globalData.configLists.version;

    let bannerUrl = this.data.bannerUrl;
    bannerUrl += `?v=${version}`
    that.setData({
      bannerUrl
    })

    this.getHotDevice();
  },

  onShow: function () {
    var that = this;
  },

  onPullDownRefresh: function () {
    var that = this;
    this.getHotDevice();
  },

  onShareAppMessage: function (res) {
    return {
      path: '/pages/recycle/home/home',
      success: function (res) {
        // 转发成功
      },
      fail: function (res) {
        // 转发失败
      }
    }
  },

  getHotDevice() {
    const that = this;
    httpTool.getHotRecycle((data)=>{
      that.setData({
        hotDevice: data,
        isShow: true
      })
      wx.hideLoading();
      wx.hideNavigationBarLoading();
      wx.stopPullDownRefresh();
    },(mes)=>{
      wx.hideLoading();
      wx.hideNavigationBarLoading();
      wx.stopPullDownRefresh();
      that.setData({
        showRefresher: true
      })
    })
  },

  goToChooseDevice(e){
    const pid = e.currentTarget.dataset.pid;
    wx.navigateTo({
      url: '../chooseDevice/chooseDevice?pid=' + pid
    })
  },

  goToChooseFault(e){
    const mid = e.currentTarget.dataset.mid;
    const mname = e.currentTarget.dataset.mname;
    const mpic = e.currentTarget.dataset.mpic;
    const bname = e.currentTarget.dataset.bname;
    const bid = e.currentTarget.dataset.bid;
    wx.navigateTo({
      url: '../selectInfo/selectInfo?mid=' + mid + '&mname=' + mname + '&mpic=' + mpic + '&bname=' + bname + '&bid=' + bid
    })
  },

  toCart(){
    wx.navigateTo({
      url: '../recycleCart/recycleCart',
    })
  },

  stopTouchMove() {

  },
  stopTap() {

  }
})
