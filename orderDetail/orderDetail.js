const util = require('../../../util/util');
const httpTool = require('../../../comm/script/fetch');
const config = require('../../../comm/script/config');
const msg = require('../../../component/message/message.js');
const app = getApp();
var md5 = require('../../../util/md5');
var jwt = require('../../../util/jwt.js');

Page({
  data: {
    message: {},
    isShow: false,
    orderId: '',
    order: {},
    createDateTime: '',
    reservedDateTime: '',
    statusTitles: ["订单处理中", "订单已预约", "工程师出发", "回收完成", '回收完成' ,"订单已取消"],
    statusIcons: ["https://pic.hiweixiu.com/hiweixiu-app/weapp/img/order_created.png", 
    "https://pic.hiweixiu.com/hiweixiu-app/weapp/img/order_assigned.png", 
    "https://pic.hiweixiu.com/hiweixiu-app/weapp/img/order_setoff.png",  
    "https://pic.hiweixiu.com/hiweixiu-app/weapp/img/order_done.png", 
    "https://pic.hiweixiu.com/hiweixiu-app/weapp/img/order_done.png", 
    "https://pic.hiweixiu.com/hiweixiu-app/weapp/img/order_cancelled.png"],
  },

  onShareAppMessage: function (res) {
    return {
      path: '/pages/repair/orderDetail/orderDetail?id=' + this.data.orderId,
      success: function (res) {
        // 转发成功
      },
      fail: function (res) {
        // 转发失败
      }
    }
  },

  onLoad: function (options) {
    var that = this;
    wx.showLoading({
      title: '加载中',
      mask: true
    })
    wx.showNavigationBarLoading();
    that.setData({
      orderId: options.id
    });
    that.getRecycleDetail();
  },

  onPullDownRefresh: function () {
    var that = this;
    wx.showNavigationBarLoading();
    that.getRecycleDetail();
  },

  getRecycleDetail() {
    const that = this;
    const id = this.data.orderId;
    httpTool.getRecycleDetail(id,(data)=>{

      var order = data;
      var createDate = util.formatDate_imprecise(order.order_at);
      var createTime = util.getTime_noSecond(order.order_at);
      var createDateTime = createDate + ' ' + createTime;
      var reserved_at = order.reserved_at;
      var reservedDateTime = reserved_at.substr(0, reserved_at.length - 3);
      that.setData({
        order,
        createDateTime,
        reservedDateTime,
        isShow: true
      })
      that.processOrderData(order);
      if (order.order_status == '2') {
        that.updateWorkerLocation(order.eng_id);
      }
      wx.hideLoading();
      wx.stopPullDownRefresh();
      wx.hideNavigationBarLoading();
    },(mes)=>{

    })
  },


  //获取订单详情
  getOrderDetail: function () {
    var that = this;
    httpTool.getOrderDetail.call(that, that.data.orderId, function (data) {
      //生成页面展示相关数据
      that.processOrderData(data);
      //更新工程师/用户位置
      that.updateLocations(data.status, data.RepairPerson);
      //数据渲染完成后 直接显示
      wx.hideLoading();
      that.setData({
        isShow: true
      });
      wx.stopPullDownRefresh();
      wx.hideNavigationBarLoading();
    }, function (mes) {
      wx.stopPullDownRefresh(); 
      wx.hideLoading();   
      wx.hideNavigationBarLoading();
      msg.show.call(that,{
        content: mes,
        icon: 'tip'
      })
    });
  },

  //生成UI展示数据
  processOrderData: function (order) {
    var status = order.order_status;
    //1.状态名称
    order.statusTitle = this.data.statusTitles[status] ? this.data.statusTitles[status] : "订单状态未知";
    //3.状态图标
    order.statusIcon = this.data.statusIcons[status] ? this.data.statusIcons[status] : "https://pic.hiweixiu.com/hiweixiu-app/weapp/img/order_cancelled.png"; //?默认图标？
    var reservedDateTime = this.data.reservedDateTime;
    //2.状态描述
    var statusDesc = order.statusTitle; //默认
    switch (status) {
      case 0: statusDesc = "请注意客服来电，与您进一步确认维修信息"; break;
      // case 2: statusDesc = "预约上门时间为：" + order.reserveTime; break;
      case 1: statusDesc = "预约上门时间为：" + reservedDateTime; break;//时间段
      case 2: statusDesc = "工程师" + order.eng_name + "号已出发，请您耐心等候"; break;
      case 3: statusDesc = "此次回收服务已确认完成，感谢您！"; break;
      case 4: 
      case 5: statusDesc = ""; break;
    }
    order.statusDesc = statusDesc;
    //end 更新数据
    this.setData({
      order: order,
      reservedDateTime
    })
  },

  //工程师位置
  updateWorkerLocation: function (workerId) {
    var that = this;
    httpTool.getWorkerLocation.call(that, workerId, function (data) {
      that.setData({
        workerLoc: {
          lng: data.longitude,
          lat: data.latitude,
          markers: [{
            iconPath: "../../../img/mark.png",
            longitude: data.longitude,
            latitude: data.latitude,
            width: 24,
            height: 31
          }]
        }
      })
    }, function (mes) {
      wx.hideLoading();
      msg.show.call(that, {
        icon: 'tip',
        content: mes
      })
    });
  },

  connectEngineer: function () {
    wx.makePhoneCall({
      phoneNumber: this.data.order.eng_mobile
    });
  },
  connectService: function () {
    wx.makePhoneCall({
      phoneNumber: '4000171010'
    });
  },

  goToChooseDevice(){
    wx.redirectTo({
      url: '../chooseDevice/chooseDevice',
    })
  },

  stopTouchMove() {

  },
  stopTap() {

  }
})
