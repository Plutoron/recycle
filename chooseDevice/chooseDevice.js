var httpTool = require('../../../comm/script/fetch');
var config = require('../../../comm/script/config');
var util = require('../../../util/util');
var md5 = require('../../../util/md5');
const msg = require('../../../component/message/message.js');
var app = getApp();

Page({
  data: {
    isShow: false,
    myMouldInfo: {},
    type: 1, //维修type=1 保险type=2 默认1
    brandList: [], //品牌名列表 {"Id": "24","BrandName": "苹果"}
    phoneList: [], //手机列表
    padList: [], //平板列表
    curBid: '24',
    curBrandItemIndex: '0',
    curPid: '15',
    curTabBarIndex: '0',
    brandData: {},
    mouldData:{},
    animate: false
  },
 
  onLoad: function (options) {
    // 页面初始化 options为页面跳转所带来的参数
    var that = this;
    wx.getSystemInfo({
      success: function (res) {
        const rate = res.windowWidth / 750; //1rpx = ? px
        const defaulHeight = res.windowHeight - 90 * rate;
        that.setData({
          scrollHeight: defaulHeight + 'px'
        })
      }
    })
    if (!!options.pid){
      this.setData({
        curPid : options.pid
      })
      if (options.pid == '16') 
        this.setData({
          curTabBarIndex: '1'
      })
    }else{
      this.setData({
        curPid: '15'
      })
    }
   
    this.getBrandListByPid(15);
    this.getBrandListByPid(16);
    console.log(that.data.curPid);
    this.getMouldListByBidPid(that.data.curBid, that.data.curPid);
  },


  getBrandListByPid(pid) {
    const that = this;
    let brandData = this.data.brandData;
    httpTool.getRecycleBrand(pid,(data)=>{
      that.setData({
        brandList: data,
        curBid: data[0].Id
      })
      brandData['key'+pid] = data;
      that.setData({
        brandData: brandData
      })
    },(mes)=>{

    })
  },

  getMouldListByBidPid(bid, pid) {
    wx.showLoading({
      title: '获取数据中',
      mask: true
    })
    const that = this;
    let mouldData = this.data.mouldData;
    httpTool.getRecycleMould(bid,pid,(data)=>{
      data.map((v, i, a) => {
        a[i].avg_price = Number(v.avg_price)
      })
      that.setData({
        mouldList: data
      })
      mouldData['key' + bid + pid] = data;

      that.setData({
        mouldData: mouldData,
        isShow: true
      })
      wx.hideLoading();
    },(mes)=>{
      wx.hideLoading();
      msg.show.call(that,{
        icon: 'tip',
        content: '获取数据失败'
      })
    })
  },

  brandTap(e) {
    const data = e.currentTarget.dataset;
    if (data.index == this.data.curBrandItemIndex) return;
    this.setData({
      curBrandItemIndex: data.index,
      curBid: data.id
    })
    this.resetScrollTop();
    this.setMouldList();
  },
  tabBarTap(e){
    const data = e.currentTarget.dataset;
    if (data.index == this.data.curTabBarIndex) return;
    this.setData({
      curTabBarIndex : data.index,
      curBrandItemIndex: 0,   
      curPid: data.pid   
    })
    if (!!!this.data.brandData['key' + data.pid]){
      this.getBrandListByPid(this.data.curPid);
      return;
    }
    const bid = this.data.brandData['key'+ data.pid][0].Id;
    this.setData({
      curBid: bid
    })
    this.resetScrollTop();
    this.setMouldList();
  },

  setMouldList(){
    const curBid = this.data.curBid;
    const curPid = this.data.curPid;
    const curKey = 'key' + curBid + curPid;
    if (!!this.data.mouldData[curKey]){
      this.setData({
        mouldList: this.data.mouldData[curKey]
      })
    }else{
      this.getMouldListByBidPid(curBid, curPid);
    }
  },

  resetScrollTop(){
    this.setData({
      scrollTop: 0
    })
  },

  itemTap(e){
    const mid = e.currentTarget.dataset.mid;
    const mname = e.currentTarget.dataset.mname;
    const mpic = e.currentTarget.dataset.mpic;
    const bname = e.currentTarget.dataset.bname;
    const bid = e.currentTarget.dataset.bid;
    wx.redirectTo({
      url: '../selectInfo/selectInfo?mid=' + mid + '&mname=' + mname + '&mpic=' + mpic + '&bname=' + bname + '&bid=' + bid
    })
  },

  stopTouchMove() {

  },
  stopTap() {

  }
});