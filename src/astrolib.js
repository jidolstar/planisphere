(function(){
	var R2D = 180.0/Math.PI;   /* degrees per radian */
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

	var Vector = function(x, y, z){
		this.x = x ? 0 : x;
		this.y = y ? 0 : y;
		this.z = z ? 0 : z;
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
	
})();