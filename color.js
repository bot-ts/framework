
class Color{
	constructor(resolvableColor){
		let rgb = Color.test(resolvableColor)
		this.confirmed = rgb !== false
		this.red = this.confirmed ? rgb[0] : 0
		this.green = this.confirmed ? rgb[1] : 0
		this.blue = this.confirmed ? rgb[2] : 0
	}
	fusion(color,fraction){
		return new Color(this.rgb.map((c,i)=>{
			return map(fraction,0,1,c,color.rgb[i])
		}))
	}
	toString(type){
		if(type === 'hex'){
			return this.hex
		}
		return this.rgb.toString()
	}
	async fill(classe){
		return await classe.setColor(this.hex).catch(err=>{})
	}
	get isColor(){
		return this.confirmed
	}
	get rgb(){
		return [this.red,this.green,this.blue]
	}
	get hex(){
		return Color.rgbToHex(this.rgb)
	}
	static gradient(colors,length){
		let array = []
		let section = length / (colors.length-1)
		for (var i=0; i<length; i++) {
			if(colors.length > 1){
				let c = Math.floor(i/section)
				array.push(
					colors[c].fusion(
						colors[c+1],
						map(i-(c*section),0,section,0,1)
					)
				)
			}else if(colors.length > 0){
				array.push(colors[0])
			}
		}
		return array
	}
	static test(resolvableColor){
		if(typeof resolvableColor === "string"){
			let rgb = Color.hexToRgb(resolvableColor)
			if(rgb!==null){
				return rgb
			}
		}else if(Array.isArray(resolvableColor)){
			let rgb = resolvableColor.filter(c=>!isNaN(c))
			if(rgb.length>2){
				return rgb
			}
		}
		return false
	}
	static random(){
		return new Color([
			Math.floor(Math.random()*255),
			Math.floor(Math.random()*255),
			Math.floor(Math.random()*255)
		])
	}
	static rgbToHex(rgb) {
		return "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
	}
	static hexToRgb(hex) {
	    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	    return result ? [
	        parseInt(result[1], 16),
	        parseInt(result[2], 16),
	        parseInt(result[3], 16)
	    ] : null;
	}
}

module.exports = Color

function map(value, start1, stop1, start2, stop2) {
    return 1.0 * start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
}