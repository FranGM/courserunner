function wrap_txt(txt) {
	var txt_array = txt.split(" ");
	console.log(txt_array);
	var new_txt_array = [];
	var str = "";
	var line_limit = 10;
	for (var i=0; i < txt_array.length; i++) {
		if (str == "") {
			str = txt_array[i];
		} else {
			if ((str.length + txt_array[i].length) > line_limit) {
				new_txt_array.push(str);
				str = txt_array[i];
			} else {
				str += " " + txt_array[i];
			}
		}
	}
	if (str != "") {
		new_txt_array.push(str);
	}
	return new_txt_array.join("\n");
}

