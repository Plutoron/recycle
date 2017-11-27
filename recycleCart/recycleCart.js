// recycleCart.js
var httpTool = require('../../../comm/script/fetch');
var config = require('../../../comm/script/config');
var util = require('../../../util/util');
var jwt = require('../../../util/jwt.js');
var md5 = require('../../../util/md5');
const msg = require('../../../component/message/message.js');
var app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    height: 0,
    touchStartPageX: 0,
    touchEndPageX: 0,
    touchStartPageY: 0,
    touchEndPageY: 0,    
    touchStartTimestamp: 0,
    touchEndTimestamp: 0,
    showCart: false,
    showDetail: false,
    emptyCart: false,
    detailList: [],
    selectList: [],
    validList: [],
    invalidList: [],
    selectNum: 0,
    selectAllOn: false,
    selectPrice: 0,
    curDel: '',
    delMode: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const that = this;
    this.setData({
      iconSize: app.globalData.winRate * 28
    })

    wx.getSystemInfo({
      success: function (res) {
        const rate = res.windowWidth / 750; //1rpx = ? px
        const defaulHeight = res.windowHeight - 140 * rate;
        that.setData({
          height: defaulHeight + 'px'
        })
      }
    })
    this.getCartList();
  },

  onShow(){
    
  },

  onPullDownRefresh(){
    this.getCartList();
  },

  touchStart(e){
    if (e.touches.length == 1) {
      this.setData({
        touchStartPageX: e.changedTouches[0].pageX,
        touchStartPageY: e.changedTouches[0].pageY,
        touchStartTimestamp: e.timeStamp,
        startIdx: e.currentTarget.dataset.idx
      })
    }
  },
  //滑动事件处理
  touchEnd(e) {
    const touchStartPageX = this.data.touchStartPageX;
    const touchStartTimestamp = this.data.touchStartTimestamp;
    const startIdx = this.data.startIdx;
    this.setData({
      touchEndPageX: e.changedTouches[0].pageX,
      touchEndPageY: e.changedTouches[0].pageY,
      touchEndTimestamp: e.timeStamp,
      endIdx: e.currentTarget.dataset.idx
    })
    if (e.currentTarget.dataset.idx != startIdx) return;

    if (e.timeStamp - touchStartTimestamp > 500) return;

    if (Math.abs(e.changedTouches[0].pageY - this.data.touchStartPageY) > 30) return;

    if (touchStartPageX - e.changedTouches[0].pageX > 40 ){
      this.setData({
        curDel: e.currentTarget.dataset.idx
      })
    }
    
    if (e.changedTouches[0].pageX - touchStartPageX > 40) {
      if (e.currentTarget.dataset.idx != this.data.curDel) return;
      this.setData({
        curDel: ''
      })
    }
  },

  getCartList(){
    var that = this;
    var validList = [];
    var invalidList = [];
    var selectList = [];
    wx.showLoading({
      title: '获取数据中',
    })
    httpTool.getRecycleCart((data)=>{
      data.map((v, i, a) => {
        a[i].now_price = Number(v.now_price)
        a[i].select = false
      })
      data.forEach((v,i,a) => {
        if (v.shr_display != 0){
          invalidList.push(v);
          return;
        }
        if(i == 0){
          v.select = true;
        }
        validList.push(v)
      }) 
      that.setData({
        validList,
        invalidList
      })
      wx.hideLoading();
     
      if (validList.length != 0){
        selectList.push(validList[0]);
        that.setData({
          selectList
        })
      }
    
      that.resetStatus();
    },(mes)=>{
      wx.hideLoading();
    })
  },

  toggleItemSelect(e){
    const index = e.currentTarget.dataset.index;
    const id = e.currentTarget.dataset.id;
    var selectList = this.data.selectList;
    var validList = this.data.validList;
    var selectIndex = 0;
    if(!!this.data.selectList.find((v,i,a)=> {
      selectIndex = i;
      return v.Id == id
    })){
      validList[index].select = false;
      selectList.splice(selectIndex,1);
    }else{
      validList[index].select = true;
      selectList.push(validList[index]);
    }
    this.setData({
      validList,
      selectList
    })
    this.resetStatus();
  },

  // 全选
  selectAll(){ 
    var validList = this.data.validList;
    if(this.data.selectAllOn){
      validList.map((v, i, a) => {
        a[i].select = false;
      })
      this.setData({
        validList,
        selectList: [],
      })
    }else{
      var selectPrice = 0;
      validList.map((v,i,a) => {
        a[i].select = true;
        selectPrice += Number(v.now_price)
      })
      this.setData({
        validList,
        selectList: validList,
      })
    }
    this.resetStatus();
  },

  // 删除当前产品
  delOneList(e){
    if(this.delMode) return;
    wx.showLoading({
      title: '删除中',
    })
    this.setData({
      delModeL:true
    })
    const that = this;
    const index = e.currentTarget.dataset.index;
    const id = e.currentTarget.dataset.id;
    var selectList = this.data.selectList;
    var validList = this.data.validList;
    const cid = id;

    httpTool.recycleCartDel(cid,(data)=>{
      console.log('删除成功？');
      if (validList[index].select === true) {
        selectList.forEach((v, i, a) => {
          if (v.Id == id) {
            selectList.splice(i, 1);
            return;
          }
        })
      }
      validList.splice(index, 1);
      that.setData({
        selectList,
        validList,
        curDel: '',
        delMode: false
      })
      that.resetStatus();
      wx.hideLoading();
    },(mes)=>{
      wx.hideLoading();
      msg.show.call(that,{
        content: '删除失败，请稍后再试',
        icon: 'tip'
      })
    })
  },

  // 删除失效产品
  deleteInvalid(e) {
    if (this.delMode) return;
    wx.showLoading({
      title: '清除中',
    })
    const that = this;
    var invalidList = this.data.invalidList;
    var arr = [];
    invalidList.forEach((v, i, a) => {
      arr.push(v.Id)
    })
    const cid = arr.join();
    httpTool.recycleCartDel(cid, (data) => {
      that.setData({
        invalidList: [],
        curDel: '',
        delMode: false
      })
      wx.hideLoading();
    }, (mes) => {
      wx.hideLoading();
      msg.show.call(that, {
        content: '删除失败，请稍后再试',
        icon: 'tip'
      })
    })
  },

  showDetailTap(e){
    const that = this;
    const cid = e.currentTarget.dataset.id;
    httpTool.showCartDetail(cid,(data)=>{
      that.setData({
        detailList: data,
        showDetail: true
      })
    },(mes)=>{

    })
  },
  
  hideDetailTap(e) {
    this.setData({
      showDetail: false
    })
  },

  toHome(){
    wx.switchTab({
      url: '/pages/recycle/home/home'
    })
  },

  resetStatus(){
    const validList = this.data.validList;
    const invalidList = this.data.invalidList;
    const selectList = this.data.selectList;

    if (validList.length == 0 && invalidList.length == 0){
      this.setData({
        showCart: false,
        emptyCart: true
      })
    }else{
      this.setData({
        showCart: true,
        emptyCart: false
      })
    }

    if (selectList.length == 0) {
      this.setData({
        selectNum: 0,
        selectAllOn: false,
        selectPrice: 0
      })
    } else {
      let selectPrice = 0;
      selectList.map((v, i, a) => {
        selectPrice += Number(v.now_price)
      })
      this.setData({
        selectNum: selectList.length,
        selectAllOn: true,
        selectPrice
      })
    }
  },

  toOrder(){
    const selectList = this.data.selectList;
    if (selectList.length == 0){
      msg.show.call(this, {
        content: '请至少选择一项',
        icon: 'tip'
      })
      return;
    }
    var selectInfo = [];
    selectList.forEach((v,i,a) => {
      const mid = v.mould_id;
      const mname = v.MouldName;
      const mpic = v.Pic;
      const bname = v.BrandName;
      const price = v.now_price + '';
      const expected_price = v.now_price + '';
      const attr_fault_data = v.attr_fault_information;
      const recycler_id = v.recycler_id;
      const cart_id = v.Id;
      var attrFault = JSON.stringify({
        attr_fault_data,
        mid,
        recycler_id,
        expected_price,
        cart_id
      });
      selectInfo.push(JSON.stringify({
        mid,
        mname,
        mpic,
        bname,
        price,
        attrFault
      }))
    })
    selectInfo = selectInfo.join('分隔符');
    wx.redirectTo({
      url: '../createOrder/createOrder?selectInfo=' + selectInfo,
    })
  },

  resetCurDel(){
    this.setData({
      curDel : ''
    })
  },

  stopTouchMove() {

  },
  stopTap() {

  }
})