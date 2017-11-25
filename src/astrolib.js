"use strict";
var Astro = (function(){
var R2D = 180.0 / Math.PI;   /* degrees per radian */
var D2R = Math.PI / 180.0;	/* radians per degree */
var S2R = 4.8481368110953599359e-6;	/* radians per arc second */
var R2H = 3.8197186342054880584532103209403; /*radians per hour */
var H2R = 0.26179938779914943653855361527329; /*hour per radians */
var J2000 = 2451545.0; /*2000년 Julian Day*/
var PI = 3.1415926535897932384626433832795; /* PI */
var TPI = 6.28318530717958647693;		/* 2PI */
var HPI = 1.5707963267948966192313216916395; /* PI/2 */

// Dividend를 Divisor 내로 넣어준다. 
// 가령 0~360까지 표현한다면 362.2일때 2.2가 되게 해준다.
var Mod = function(dividend, divisor){
	return dividend - (Math.floor(dividend / divisor) * divisor);
};
// from <= x < to로 정규화한다.
var normalize = function(x, from, to){
	var w = to - from;
	return x - Math.floor((x - from) / w) * w;
};

var Time = (function(){
	var dgmt = 9; //한국 표준시 
	var glon = 126.59 * D2R; //지방 경도 
	var glat = 37.34 * D2R; //지방 위도 
	return {
		//현재 위치와 시간 셋팅 
		setPosAndTime:function(new_glon, new_glat, new_dgmt){
			glon = new_glon * D2R;
			glat = new_glat * D2R;
			dgmt = new_dgmt;
		},
		//Julian day
		getJD:function(year, month, day, hour, minute, second){
			if(month < 3){
				year--;
				month += 12;
			}
			var A = Math.floor(year / 100);
			var B = Math.floor(A / 4);
			return Math.floor(365.25 * year) + 2 - A + B + 
				   Math.floor(30.6 * month - 0.4) + day + 1721025.5 + 
				   hour / 24.0 +
				   minute / 1440.0 + 
				   second / 86400.0;			
		},
		//Universial Time -> Local Civil Time
		ut2lct:function(ut){
			return ut + dgmt / 24.0;
		},
		//Greenwich siderial time -> Local Civil Time
		gst2lct:function(gst){
			return Time.ut2lct(Time.gst2ut(gst));
		},
		//Greenwich siderial time -> Local Civil Time
		gst2lct:function(gst){
			return Time.ut2lct(Time.gst2ut(gst));
		},
		//Local sidereal time -> Local civil time
		lst2lct:function(lst){
			return Time.gst2lct(Time.lst2gst(lst));
		},
		//Local civil time -> Greenwich sidereal time
		lct2gst:function(lct){
			return Time.ut2gst(Time.lct2ut(lct));
		},
		// Julian Day Number -> Date(일자단위)
		getDayNumber:function(jd){
			return Math.floor(jd - 0.5) + 0.5;
		},
		//Julian Day Number -> Time(시간단위)
		getTime:function(jd){
			return (jd - Time.getDayNumber(jd)) * 24.0;
		},
		//Greenwich sidereal time -> Local sidereal time
		gst2lst(gst){
			return gst + glon * R2H / 24.0;
		},
		//Universial time -> Local sidereal time
		ut2lst:function(ut){
			return Time.gst2lst(Time.ut2gst(ut));
		},
		//Local civil time -> Local siderial time
		lct2lst:function(lct){
			return Time.ut2lst(Time.lct2ut(lct));
		},
		//Local civil time -> Universial time
		lct2ut:function(lct){
			return lct - dgmt / 24.0;
		}, 
		//Universial time -> Greenwich sidereal time
		ut2gst:function(ut){
			var ut_date = Time.getDayNumber(ut);
			var ut_time = Time.getTime(ut);
			var t = (ut_date - 2451545.0) / 36525.0;
			var t0 = 6.697374558 + (2400.051336 * t) + (0.000025862 * t * t);
			t0 = normalize(t0, 0, 24);
			var gst_time = ut_time * 1.00273790935 + t0;
			gst_time = normalize(gst_time, 0, 24);
			return ut_date + gst_time / 24.0;
		},
		//Greenwich sidereal time -> Universal time
		gst2ut:function(gst){
			var gst_date = Time.getDayNumber(gst);
			var t:Number = (gst_date - 2451545.0) / 36525.0;
			var t0:Number = 6.697374558 + (2400.051336 * t) + (0.000025862 * t * t);
			t0 = normalize(t0, 0, 24);
			var ut_time:Number = (GetTime(gst) - t0);
			ut_time = normalize(ut_time, 0, 24);
			ut_time *= 0.9972695663;
			return gst_date + ut_time / 24.0;
		},
		//Local sidereal time -> Greenwich sidereal time
		lst2gst:function(lst){
			return lst - glon / TPI;
		},
		//Local sidereal time -> Universial time
		lst2ut:function(lst){
			return Time.gst2ut(Time.lst2gst(lst));
		},
		// 특정 고도에 있을 때의 local hour angle을 구함
		getHAFromDec:function(alt, dec){
			return Math.acos((Math.sin(alt) - Math.sin(glat) * Math.sin(dec)) / (Math.cos(glat) * Math.cos(dec)));
		}	
	};
})();


var Vector = function(x, y, z){
	this.x = x ? x : 0;
	this.y = y ? y : 0;
	this.z = z ? z : 0;
};
Vector.prototype.setLonLat = function(lon, lat){
	var coslat = Math.cos(lat);
	this.x = coslat * Math.cos(lon);
	this.y = coslat * Math.sin(lon);
	this.z = Math.sin(lat);
};
Vector.prototype.getLon = function(){
	var ret = Math.atan2(this.y, this.x);
	if(ret < 0) ret += TPI;
	return ret;
};
Vector.prototype.getLat = function(){
	var x = this.x, y = this.y, z = this.z;
	var r = Math.sqrt(x * x + y * y + z * z);
	return Math.asin(z / r);
};
Vector.prototype.getLength = function(){
	var x = this.x, y = this.y, z = this.z;
	return Math.sqrt(x * x + y * y + z * z);
};
Vector.prototype.normalize = function(){
	var r = this.getLength();
	this.x /= r;
	this.y /= r;
	this.z /= r;
};
Vector.prototype.multiply = function(m, v){
	this.x = v.x * m.val[0][0] + v.y * m.val[0][1] + v.z * m.val[0][2];
	this.y = v.x * m.val[1][0] + v.y * m.val[1][1] + v.z * m.val[1][2];
	this.z = v.x * m.val[2][0] + v.y * m.val[2][1] + v.z * m.val[2][2];
};
// 적도좌표 -> 황도좌표값을 계산
// 인자 : 적도좌표 Vector, dt : Day Number
// 주의 : 한개의 좌표값에 대해서만 사용할 것 - 많은 좌표는 Matirx이용
Vector.prototype.equ2ecl = function(equ, dt){
	var d = dt - 2451543.5;
	var e = (23.4393 - 3.563e-7 * d) * D2R;
	var cos_e = Math.cos(e);
	var sin_e = Math.sin(e);
	var x1 = equ.x;
	var y1 = equ.y;
	var z1 = equ.z;
	this.x = x1; 						//x1 * 1.0 + y1 * 0 + z1 * 0;
	this.y = y1 * cos_e + z1 * sin_e; 	//x1 * 0 + y1 * cos_e + z1 * sin_e;
	this.z = y1 * -sin_e + z1 * cos_e; 	//x1 * 0 + y1 * -sin_e + z1 * cos_e;		
};
// 지평좌표 -> 적도좌표
// 인자 : 지평좌표 백터, Local Siderial Time, 위도			
// 주의 : 한개의 좌표값에 대해서만 사용할 것 - 많은 좌표는 Matirx이용	
Vector.prototype.hor2equ = function(hor, lst, lat){
	var mat = new Matrix(0,0,0,0,0,0,0,0,0); 
	mat.hor2Equ(lst, lat);
	this.multiply(mat, hor);			
};
// 적도좌표 -> 은하좌표
// 인자 : 적도좌표값				
// 주의 : 한개의 좌표값에 대해서만 사용할 것 - 많은 좌표는 Matirx이용	
Vector.prototype.equ2gal = function(equ){
	var x1 = equ.x;
	var y1 = equ.y;
	var z1 = equ.z;
	this.x = x1 * -0.0669887 + y1 * -0.8727558 + z1 * -0.4835389;
	this.y = x1 * 0.4927285 + y1 * -0.4503470 + z1 * 0.7445846;
	this.z = x1 * -0.8676008 + y1 * -0.1883746 + z1 * 0.4601998;
};
// 황도좌표->적도좌표
// 인자 : 황도좌표, Day Number				
// 주의 : 한개의 좌표값에 대해서만 사용할 것 - 많은 좌표는 Matirx이용		
Vector.prototype.ecl2equ = function(ecl, dt){
	var x1 = ecl.x;
	var y1 = ecl.y;
	var z1 = ecl.z;
	var d = dt - 2451543.5;
	var e = (23.4393 - 3.563e-7 * d) * D2R;
	var cos_e = Math.cos(e);
	var sin_e = Math.sin(e);
	this.x = x1;						//x1 * 1.0 + y1 * 0.0 + z1 * 0.0;
	this.y = y1 * cos_e + z1 * -sin_e; 	//x1 * 0.0 + y1 * cos_e + z1 * -sin_e;
	this.z = y1 * sin_e + z1 * cos_e; 	//x1 * 0.0 + y1 * sin_e + z1 * cos_e;
};
// 황도좌표->지평좌표
// 인자 : 황도좌표값, Local siderial Time, 위도				
// 주의 : 한개의 좌표값에 대해서만 사용할 것 - 많은 좌표는 Matirx이용		
Vector.prototype.ecl2hor = function(ecl, lst, lat){
	var equ = new Vector();
	equ.ecl2equ(ecl, lst);
	this.equ2hor(equ, lst, lat);
}
// 적도좌표 -> 지평좌표
// 인자 : 지평좌표값, Local siderial Time, 위도				
// 주의 : 한개의 좌표값에 대해서만 사용할 것 - 많은 좌표는 Matirx이용		
Vector.prototype.equ2hor = function(equ, lst, lat){
	var mat:Matrix = new Matrix(0, 0, 0, 0, 0, 0, 0, 0, 0); 
	mat.equ2hor(lst, lat);
	this.multiply(mat, equ);
};

var Matrix = function(x11, x12, x13, x21, x22, x23, x31, x32, x33){
	this.val = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
	this.set(x11, x12, x13, x21, x22, x23, x31, x32, x33);
};
Matrix.prototype.set = function(x11, x12, x13, x21, x22, x23, x31, x32, x33){
	this.val[0][0] = x11 ? x11 : 0;
	this.val[0][1] = x12 ? x12 : 0;
	this.val[0][2] = x13 ? x13 : 0;
	this.val[1][0] = x21 ? x21 : 0;
	this.val[1][1] = x22 ? x22 : 0;
	this.val[1][2] = x23 ? x23 : 0;
	this.val[2][0] = x31 ? x31 : 0;
	this.val[2][1] = x32 ? x32 : 0;
	this.val[2][2] = x33 ? x33 : 0;
};
Matrix.prototype.get = function(row, col){
	return this.val[row][col];
};
//두개의 행렬을 곱해준다.
Matrix.prototype.multiply = function(m1, m2){
	var r, c, i;
	for(r = 0; r < 3; r++){
		for(c = 0; c < 3; c++){
			this.val[r][c] = 0;
			for(i = 0; i < 3; i++) this.val[r][c] += m1.val[r][i] * m2.val[i][c];
		}
	}
};
// 지평좌표->적도좌표 로 변환하는 행렬 만들기
// 인자 : Local Sidereal Time, 위도
Matrix.prototype.hor2equ = function(lst, lat){
	var lst_rad = Time.getTime(lst) * H2R;
	var cos_lst = Math.cos(lst_rad); 
	var sin_lst = Math.sin(lst_rad);
	var cos_lat = Math.cos(lat); 
	var sin_lat = Math.sin(lat);
	this.set(
		-cos_lst * sin_lat,	-sin_lst,	cos_lst * cos_lat,
		-sin_lst * sin_lat,	cos_lst,	sin_lst * cos_lat,
		cos_lat,			0.0,		sin_lat);
};
// 적도좌표->지평좌표 로 변환하는 행렬 만들기
// 인자 : Local Sidereal Time, 위도
Matrix.prototype.equ2hor = function(lst, lat):void{
	var lst_rad:Number = Time.getTime(lst) * H2R;
	var cos_lst:Number = Math.cos(lst_rad);
	var sin_lst:Number = Math.sin(lst_rad);
	var cos_lat:Number = Math.cos(lat);
	var sin_lat:Number = Math.sin(lat);
	this.set(
		-sin_lat * cos_lst,	-sin_lat * sin_lst, cos_lat,
		-sin_lst, 			cos_lst, 			0.0,
		cos_lat * cos_lst, 	cos_lat * sin_lst, 	sin_lat);
};
// 은하좌표->지평좌표 로 변환하는 행렬 만들기
// 인자 : Local Sidereal Time, 위도
Matrix.prototype.gal2hor = function(lst, lat){
	var m1 = new Matrix(), m2 = new Matrix();
	m1.equ2hor(lst, lat), m2.gal2equ();
	this.multiply(m1, m2);
};
// 황도좌표->지평좌표 로 변환하는 행렬 만들기
// 인자 : Local Sidereal Time, 위도
Matrix.prototype.ecl2hor = function(lst, lat){
	var m1 = new Matrix(), m2 = new Matrix();
	m1.equ2hor(lst, lat);
	m2.ecl2equ(lst);
	this.multiply(m1, m2);
};
// 은하좌표->적도좌표 로 변환하는 행렬 만들기
// 인자 : 없음
Matrix.prototype.gal2equ = function(){
	this.set(
		-0.0669887, 0.4927285, -0.8676008, 
		-0.8727558, -0.4503470, -0.1883746, 
		-0.4835389, 0.7445846, 0.4601998);
};
// 황도좌표->적도좌표 로 변환하는 행렬 만들기
// 인자 : Day Number
Matrix.prototype.ecl2equ = function(dt){
	var d = dt - 2451543.5;
	var e = (23.4393 - 3.563e-7 * d) * D2R;
	var cos_e = Math.cos(e);
	var sin_e = Math.sin(e);
	this.set(
		1.0, 0.0, 0.0,
		0.0, cos_e, -sin_e,
		0.0, sin_e, cos_e);
};
// 적도좌표->황도좌표 로 변환하는 행렬 만들기
// 인자 : Day Number
Matrix.prototype.equ2ecl = function(dt){
	var d = dt - 2451543.5;
	var e = (23.4393 - 3.563e-7 * d) * D2R;
	var cos_e = Math.cos(e);
	var sin_e = Math.sin(e);
	this.set(
		1.0, 0.0, 0.0,
		0.0, cos_e, sin_e,
		0.0, -sin_e, cos_e);
};

return{
	Time:Time,
	Vector:Vector,
	Matrix:Matrix
};
})();