// resultPage.js
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
    promiseList:[{
      imgUrl: 'https://pic.hiweixiu.com/images/mrecy.hiweixiu.com/bjwy.png',
      content: '保价无忧'
    },{
      imgUrl: 'https://pic.hiweixiu.com/images/mrecy.hiweixiu.com/jsfk.png',
      content: '极速返款'
    },{
      imgUrl: 'https://pic.hiweixiu.com/images/mrecy.hiweixiu.com/yzfw.png',
      content: '优质服务'
    },{
      imgUrl: 'https://pic.hiweixiu.com/images/mrecy.hiweixiu.com/ysbh.png',
      content: '隐私保护'
    }],
    mid: '',
    mname: '',
    mpic: '',
    bname: '',
    bid: '',
    price: '', 
    attr_fault_data: '',
    recycler_id: '',
    selectInfo: [],
    cartNum: 0,
    adding: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const mid = options.mid;
    const mname = options.mname;
    const mpic = options.mpic;
    const bname = options.bname;
    const bid = options.bid;
    const price = options.price; 
    const attr_fault_data = options.attr_fault_data;
    const recycler_id = options.recycler_id;
    const selectInfo = options.selectInfoStr.split('，');
    selectInfo.map((v,i,a) => {
      a[i] = JSON.parse(v);
    })
    this.setData({
      mid,
      mname,
      mpic,
      price,
      bname,
      bid,
      attr_fault_data,
      recycler_id,
      selectInfo
    })
  },

  onShow(){
    if (jwt.jwtToken()) { //如果存在token（用户已登录）
      this.getCartNum();
    }
  },

  reAssess(){
    var pages = getCurrentPages();
    var prevPage = pages[pages.length - 2];  //上一个页面

    if (typeof (prevPage.resetAll) === "function") {
      prevPage.resetAll();
      wx.navigateBack();
    }
  },

  toCreateOrder(){
    const mid = this.data.mid;
    const mname = this.data.mname;
    const mpic = this.data.mpic;
    const bname = this.data.bname;
    const price = this.data.price;
    const expected_price = this.data.price + '';
    const attr_fault_data = this.data.attr_fault_data;
    const recycler_id = this.data.recycler_id;
    const cart_id = '';

    var attrFault = JSON.stringify({
      attr_fault_data,
      mid,
      recycler_id,
      expected_price,
      cart_id
    });
    
    var selectInfo = [JSON.stringify({
      mid,
      mname,
      mpic,
      bname,
      price,
      attrFault
    })]
 
    selectInfo = selectInfo.join('分隔符');
    wx.navigateTo({
      url: '../createOrder/createOrder?&selectInfo=' + selectInfo  
    })
  },

  getCartNum(){
    const that = this;
    if (!!!jwt.jwtToken()) return;
    httpTool.getCartNum((data)=>{
      that.setData({
        cartNum: data
      })
    },(mes)=>{

    })
  },

  addToCart(){
    var that = this;
    if(this.data.adding) return;
    if (jwt.jwtToken()) { //如果存在token（用户已登录）
      this.setData({
        adding:true
      })
    } else { //未登录
      that.showToLoginMould();
      return;
    }
    const attr_fault_information = this.data.attr_fault_data;
    const expected_price = this.data.price;
    const mould_id = this.data.mid;
    const brand_id = this.data.bid;
   
    httpTool.addToCart(
      attr_fault_information,
      brand_id,
      expected_price,
      mould_id, (data)=>{
        setTimeout(()=>{
          that.setData({
            adding: false
          })
        },1500)
        msg.show.call(that, {
          icon: 'ok',
          content: '添加成功'
        }) 
        that.setData({
          cartNum: Number(that.data.cartNum) + 1
        }) 
      }, (mes)=>{

      })
  },

  toRecycleCart(){
    if (jwt.jwtToken()) { //如果存在token（用户已登录）
      wx.navigateTo({
        url: '../recycleCart/recycleCart'
      })
    } else { //未登录
      this.showToLoginMould();
    }
  },

  showToLoginMould(){
    wx.showModal({
      title: '小提示',
      content: '只有登录用户可以使用回收车功能，点击登录跳转登录界面，或者直接下单',
      confirmText: '登录',
      success: function (res) {
        if (res.confirm) {
          wx.navigateTo({
            url: '../../personal/login/login'
          })
        }
      }
    })
  },

  stopTouchMove() {

  },
  stopTap() {

  }
})