var httpTool = require('../../../comm/script/fetch');
var config = require('../../../comm/script/config');
var util = require('../../../util/util');
var app = getApp();
var timeView;
import { XYReserveTimeView } from '../../../component/XYReserveTimeView-bak/XYReserveTimeView';

const msg = require('../../../component/message/message.js');
var md5 = require('../../../util/md5');
var jwt = require('../../../util/jwt.js');

Page({
  timeView,
  data: {
    payWayList: [{
      content: '微信',
      icon:'wx',
      input: true
    },{
      content: '支付宝',
      icon: 'zfb',
      input: true
    },{
      content: '当面现金支付',
      icon: 'xj',
      input: false
    }],
    isShowPlaceHold: true,
    
    hasLogin: false, //用户是否已登录
    phone: '',
    code: '',
    selectedAddress: {},
    time: '',
    remark: '',
    second: 60,
    getAuthCodeTextColor: '',
    disabled: false,
    getSmsCode: "获取验证码",
    dateList: [],
    start_reservetime: '',
    next_reservetime: '',

    payment: '',
    account: '',

    mid: '',
    mname: '',
    mpic: '',
    bname: '',
    price: '',
    attr_fault_data: '',
    selectMouldList:[]

  },
  /*
    #pragram- lifeCyle
  */
  onTapTime() {
    var that = this;
    if (util.isEmpty(that.data.selectedAddress)) {
      msg.show.call(that, {
        content: '请先选择地址',
        icon: 'tip'
      })
    } else {
      that.getReserveTime();
      that.timeView.setViewData(that.data.dateList);
      that.timeView.show();
    }
  },

  onLoad: function (options) {
    var that = this;

    that.timeView = new XYReserveTimeView();
    // noinspection JSAnnotator
    that.timeView.init('phone', {
      onChange(dateAndTimeStr, start_timestamp, next_timestamp) {
        var start_timestamp_str = '' + start_timestamp;
        var next_timestamp_str = '' + next_timestamp;
        that.setData({
          time: dateAndTimeStr,
          start_reservetime: start_timestamp_str,
          next_reservetime: next_timestamp_str
        })
      }
    });

    //设置默认时间
    // var nowDate = new Date();//时间段
    // var time = util.formatTime(new Date());//时间段
    let selectMouldList = options.selectInfo.split('分隔符');
    var price = 0;

    selectMouldList.map( (v,i,a) => {
      a[i] = JSON.parse(v);
      price += Number(JSON.parse(v).price);
    })
    
    this.setData({
      selectMouldList,
      price
    })

    that.loadUserData();
  },

  onShow: function () {
    //自动获取地址，手机号等信息
    var that = this;
    wx.getStorage({
      key: config.storageKeys.selectedAddress,
      success: function (res) {
        if (util.isExist(res.data)) {
          that.setData({
            selectedAddress: res.data,
            isShowPlaceHold: false
          });
          that.getReserveTime();
        } else {
          that.setData({
            isShowPlaceHold: true
          });
        }
      }
    })
  },
  /*
    #pragram- httpRequest
  */
  getReserveTime: function () {
    var that = this;
    httpTool.getReserveTimeByCityId.call(that, that.data.selectedAddress.cityID, function (data) {
      if (!util.isExist(data.data)) return;
      var obj = data.data;
      var noti = data.notice;
      obj[0].notice = noti;
      that.setData({
        dateList: obj
      })
    }, function (mes) {
      msg.show.call(that, {
        content: mes,
        icon: 'tip'
      });
    });
  },

  getCityId: function () {
    var that = this;
    var selectedAddress = wx.getStorageSync(config.storageKeys.selectedAddress);
    httpTool.getCityInfo.call(that, selectedAddress.province, selectedAddress.city, selectedAddress.district, function (data) {
      selectedAddress.cityID = data.city_id;
      that.setData({
        selectedAddress: selectedAddress
      });
      wx.setStorage({
        key: config.storageKeys.selectedAddress,
        data: selectedAddress
      });
      that.getReserveTime();
    }, function (msg) {
    });
  },

  countdown: function (that) {
    var second = that.data.second;
    if (second === 0) {
      that.setData({
        second: 60,
        getSmsCode: "获取验证码",
        getAuthCodeTextColor: "#ff5000",
        disabled: false
      });
      return;
    }
    var time = setTimeout(function () {
      that.setData({
        second: second - 1,
        getSmsCode: "(" + second + ")重新发送",
        getAuthCodeTextColor: "#CCC",
        disabled: true
      });
      that.countdown(that);
    }, 1000);
  },

  loadUserData: function () {
    var that = this;
    if (util.isExist(app.globalData.hwxUserInfo)) { //已登录的用户
      that.setData({
        phone: app.globalData.hwxUserInfo.UserName,
        hasLogin: true
      });

    } else {
      that.setData({
        phone: "",
        hasLogin: false
      });
      wx.removeStorage({
        key: config.storageKeys.selectedAddress,
        success: function (res) {

        }
      })
    }
  },
  /*
    #pragram- bindChange
  */
  inputPhone: function (e) {
    var that = this;
    that.setData({
      phone: e.detail.value
    });
  },

  inputCode: function (e) {
    var that = this;
    that.setData({
      code: e.detail.value
    });
  },

  bindDateChange: function (e) {
    var that = this;
    that.setData({
      date: e.detail.value
    });
  },

  bindTimeChange: function (e) {
    var that = this;
    that.setData({
      time_point: e.detail.value
    });
  },

  inputDetail: function (e) {
    var that = this;
    that.setData({
      remark: e.detail.value
    });
  },
  /*
    #pragram- bindtap
  */
  selectAddress: function (e) {
    wx.navigateTo({
      url: "../../personal/addAddress/addAddress?selectedAddress=" + JSON.stringify(this.data.selectedAddress)
    });
  },

  //前往订单详情页面
  goToOrderDetail: function (id) {
    wx.redirectTo({
      url: "../orderDetail/orderDetail?id=" + id
    });
  },

  sendCode: function (e) {
    var that = this;
    if (that.data.phone.length === 0) {
      msg.show.call(that, {
        content: '手机号码不能为空',
        icon: 'tip'
      });

      return;
    }
    if (!that.checkPhoneNum(that.data.phone)) {
      msg.show.call(that, {
        content: '请输入正确的手机号码',
        icon: 'tip'
      });

      return;
    }

    if (that.data.disabled) return;
    that.countdown(that);

    msg.show.call(that, {
      content: '已发送' + that.data.phone,
      icon: 'ok'
    });


    httpTool.getVerifyCode.call(that, that.data.phone, function () {

      msg.show.call(that, {
        content: '获取成功',
        icon: 'ok'
      });

      that.setData({
        disabled: true
      })
    }, function (mes) {
      msg.show.call(that, {
        content: '发送验证码失败',
        icon: 'tip'
      })
    });
  },

  checkPhoneNum: function (phoneNum) {
    const that = this;
    var rightFormat = util.isPhoneNum(phoneNum);
    if (!rightFormat) {
      msg.show.call(that, {
        content: '手机号码格式不正确',
        icon: 'tip'
      })
    }
    return rightFormat;
  },

  checkSmsCode: function (smsCode) {
    var that = this;
    if (that.data.hasLogin)return;
    var rightFormat = !util.isBlank(smsCode);
    if (!rightFormat) {
      msg.show.call(that, {
        content: '请输入验证码',
        icon: 'tip'
      })
    }
    return rightFormat;
  },

  payWayTap(e){
    const index = e.currentTarget.dataset.index;
    if (index === this.data.payment){
      this.setData({
        payment: ''
      })
      return;
    }
    this.setData({
      payment: index
    })
  },

  payWayVal(e){
    const val = e.detail.value;
    this.setData({
      account: val
    })
  },

  submit: function (e) {
    const that = this;
    if (util.isExist(app.globalData.hwxUserInfo)) {
      //已登录用户，直接提交
      that.createOrder();
    } else {
      if (!that.checkPhoneNum(that.data.phone))
        return;
      if (!that.checkSmsCode(that.data.code))
        return;
      httpTool.doLoginWithPhone.call(that, that.data.phone, that.data.code, function (data) {
        app.setHwxUserInfo(data); //缓存登录状态
        that.createOrder(); //提交订单
      }, function (mes) {
        msg.show.call(that, {
          content: mes,
          icon: 'tip'
        })
      });
    }
  },

  createOrder: function () {
    //时间段
    //reserveTime 替换为that.data.reserveTime that.data.reserveTime2
    const that = this;
    if (util.isEmpty(that.data.selectedAddress)) {
      msg.show.call(that, {
        content: '请先选择地址',
        icon: 'tip'
      });
      return;
    }
    if (util.isEmpty(that.data.next_reservetime)) {
      msg.show.call(that, {
        content: '请选择预约时间',
        icon: 'tip'
      });
      return;
    }

    if (that.data.payment === '') {
      msg.show.call(that, {
        content: '请选择支付方式',
        icon: 'tip'
      });
      return;
    }

    if (that.data.account === '' && that.data.payment != 2) {
      msg.show.call(that, {
        content: '请填写收款账号',
        icon: 'tip'
      });
      return;
    }
  
    wx.showLoading({
      title: '正在下单中',
      mask: true
    })

    const account = encodeURI(this.data.account);
    const reserved_at = this.data.start_reservetime;
    const sms_code = this.data.code;
    const contacts = encodeURI(this.data.selectedAddress.contacts);
    const tel = this.data.phone;
    const district = this.data.selectedAddress.districtID;
    const address = encodeURI(this.data.selectedAddress.address);
    const payment = this.data.payment;
    const remark = encodeURI(this.data.remark);
    const platform = 10;
    var newAttrFault = '';
    var attrFault = '';

    this.data.selectMouldList.forEach((v, i, a) => {
      newAttrFault += v.attrFault;
      if (i != a.length - 1) newAttrFault += ','
    })
    attrFault = '[' + newAttrFault + ']';

    httpTool.createRecycleOrder(
      account,
      address,
      attrFault,
      contacts,
      district,
      payment,
      remark,
      reserved_at,
      sms_code,
      tel,
      platform,(data)=>{
        wx.hideLoading();
        if (data.length > 1) {
          msg.show.call(that, {
            content: '下单成功，请在我的订单内查看',
            icon: 'tip'
          })
          setTimeout(() => {
            wx.redirectTo({
              url: '../../personal/myOrder/myOrder',
            })
          }, 1500);
          return;
        }
        that.toOrderDetail(data[0].order_num);
      },(mes)=>{
        wx.hideLoading();        
        msg.show.call(that,{
          icon : 'tip',
          content: mes
        })
      })
  },

  toOrderDetail(orderid){
    const id = orderid;
    wx.redirectTo({
      url: '../orderDetail/orderDetail?id=' + id
    })
  },

  toUserAgreement() {
    wx.navigateTo({
      url: '../../repair/userAgreement/userAgreement',
    })
  },

  stopTouchMove() {

  },
  stopTap() {

  }
});