var httpTool = require('../../../comm/script/fetch');
var config = require('../../../comm/script/config');
var util = require('../../../util/util');
var md5 = require('../../../util/md5');
const msg = require('../../../component/message/message.js');
var app = getApp();
// selectInfo.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    mid:"",
    mname:"",
    mpic:'',
    bname: '',
    bid:'',
    price: '',
    recycler_id:'',
    info: [],
    otherFault: [],
    progressNum: '',
    progressRate: '',
    curId: '',
    editId: '',
    faultIdList: [],
    length: 1,
    showOther: false,
    // faultList: [{
    //   fid: '47',
    //   detailid: "30468",
    //   info: "香港行货（香港购买，全球联保）",
    //   index: '1',
    //   idx: '0'
    // }]
    faultList: [],
    otherFaultList: [],
    tipList: {},
    disabled: true,
    scrollTop: 0,
    winRate: '',
    showMask: false,
    showView: false,
    selectInfo: [],
    attr_fault_data: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const that = this;
    wx.showLoading({
      title: '加载数据中',
      mask: true
    })
    wx.getSystemInfo({
      success: function (res) {
        const winRate = res.windowWidth / 750; //1rpx = ? px
        const defaulHeight = res.windowHeight - 230 * winRate;
        that.setData({
          scrollHeight: defaulHeight + 'px',
          winRate
        })
      }
    })
    this.setData({
      mid: options.mid,
      mname: options.mname,
      mpic: options.mpic,
      bname: options.bname,
      bid: options.bid
    })
    wx.setNavigationBarTitle({
      title: options.mname
    })
    this.getFaultList(options.mid);
  },

  getFaultList(mid){
    const that = this;
    var other = [];
    httpTool.getRecycleFault(mid,(data)=>{
      data[0].child.map((v, i, a) => {
        v.attr_fault_info = v.attr_fault_info.split("（")[0];
      })
      if(data.length > 1){
        data[1].child.map((v, i, a) => {
          v.attr_fault_info = v.attr_fault_info.split("（")[0];
        })
        other = data.pop();
      }
  
      const progressRate = 1 / data.length * 100;
      that.setData({
        info: data,
        otherFault: other,
        curId: data[0].id,
        progressRate: progressRate
      })

      that.setData({
        showView: true
      })
      wx.hideLoading();
    }, (mes)=>{

    })
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  },

  topItemTap(e){ 
    const that = this;
    const id = e.currentTarget.dataset.fid;
    const index = e.currentTarget.dataset.index;
    if(index >=  this.data.length) return;
    if (id < that.data.curId){
        that.setData({ editId: id });
        return;
    }
    if ( id != that.data.curId ){
      if (this.data.faultList.length == that.data.info.length) {
        that.setData({ editId: id })
        return
      }
      that.setData({ curId: id })
    }
  },

  downBlockItemTap(e){
    const fid = e.currentTarget.dataset.fid;
    const fname = e.currentTarget.dataset.fname;
    const detailid = e.currentTarget.dataset.detailid;
    const info = e.currentTarget.dataset.info;
    const idx = e.currentTarget.dataset.idx;
    const index = e.currentTarget.dataset.index;
    const faultList = this.data.faultList;
    let length = this.data.length;
    let max = this.data.info.length;
    if (!!faultList[idx]){
        faultList[idx] = { fid, fname, detailid, info, idx, index};
        if (fid == this.data.curId){
          this.setData({
            curId: ''
          })
        }
        this.setData({
          faultList,
          editId: ''
        }) 
    }else{
      if( idx < (max - 1)){
        let curId = this.data.info[Number(idx)+1].id;
        this.setData({
          curId,
          scrollTop: (Number(idx) + 1) * 100 * this.data.winRate
        })
      }else{
        this.setData({
          curId: '',
          showOther: true,
          disabled: false
        })
      }
      faultList[idx] = { fid, fname, detailid, info, idx, index};

      length++;
      this.setData({
        faultList,
        length,
        progressNum: this.data.progressRate * (idx + 1)
      })
    }
  },

  otherFaultItemTap(e){
    const fid = e.currentTarget.dataset.fid;
    const fname = e.currentTarget.dataset.fname;
    const detailid = e.currentTarget.dataset.detailid;
    const info = e.currentTarget.dataset.info;
    const index = e.currentTarget.dataset.index;
    const otherFaultList = this.data.otherFaultList;
    if (util.isEmpty(otherFaultList[index]|| !!otherFaultList[index] ) ) {
      otherFaultList[index] = { fid, fname, detailid, info, index };
      this.setData({
        otherFaultList
      })
    } else{
      delete otherFaultList[index];
      this.setData({
        otherFaultList
      })
    }
  },

  tipTap(e){
    const title = e.currentTarget.dataset.finfo;
    const imgUrl = e.currentTarget.dataset.photopath;
    const content = e.currentTarget.dataset.photoinfo != 'undefined' ? e.currentTarget.dataset.photoinfo : '' ;
    this.setData({
      tipList: {
        imgUrl,
        title,
        content
      },
      showMask: true
    })
  },
  iconTap(e){
    this.setData({
      showMask: false
    })
  },

  toResultBtnTap(){
    wx.showLoading({
      title: '估价中',
      mask: true
    })
    let selectInfo = [];
    let arr = [];
    if (!util.isEmpty(this.data.faultList)) {
       this.data.faultList.forEach((v) => {
        selectInfo.push(JSON.stringify({fname: v.fname,info: v.info}))
      })
    }
    if (!util.isEmpty(this.data.otherFaultList)){
      let otherFaultName = ''
      this.data.otherFaultList.forEach((v) => {
        otherFaultName = v.fname;
        arr.push(v.info)
      }) 
      let otherFaultVal = arr.join(',');
      selectInfo.push(JSON.stringify({ fname: otherFaultName, info: otherFaultVal }))
    }
    this.setData({
      selectInfo
    })
    this.getAppraisePrice();
  },

  getAppraisePrice(){
    const that = this;
    const mould_id = this.data.mid;
    let arr = [];
    this.data.faultList.forEach((v) => {
      arr.push(v.detailid);
    })
    this.data.otherFaultList.forEach((v) => {
      arr.push(v.detailid);
    })
    let attr_fault_info_id_real = arr.join(',')
    this.setData({
      attr_fault_data: attr_fault_info_id_real
    })

    httpTool.getAppraisePrice(
      mould_id,
      attr_fault_info_id_real, (data)=>{
        that.setData({
          price: Number(data.price),
          recycler_id: data.recycler_id
        })
        that.toResultPage();
      }, (mes)=>{

      })
  },

  toResultPage(){
    const mid = this.data.mid;
    const mname = this.data.mname;
    const mpic = this.data.mpic;
    const bname = this.data.bname;
    const bid = this.data.bid;
    const price = this.data.price;
    const attr_fault_data = this.data.attr_fault_data;
    const recycler_id = this.data.recycler_id;
    const selectInfoStr = this.data.selectInfo.join('，');
    wx.navigateTo({
      url: '../resultPage/resultPage?mid=' + mid + '&mname=' + mname + '&mpic=' + mpic + '&bid=' + bid + '&bname=' + bname + '&price=' + price + '&attr_fault_data=' + attr_fault_data + '&recycler_id=' + recycler_id  + '&selectInfoStr=' + selectInfoStr
    })
    wx.hideLoading();
  },

  resetAll(){
    const curId = this.data.info[0].id;
    this.setData({
      curId,
      editId: '',
      faultList: [],
      otherFaultList: [],
      progressNum: 0,
      length: 1,
      attr_fault_data: '',
      showOther: false,
      scrollTop: 0
    })
  },

  // 事件阻止？
  stopTouchMove(){

  },

  stopTap(){

  }
})