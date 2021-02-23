/*
*
* CLI-Display  
* Mostely methods to simplefy displaying messages to consoles
*
*/
const display={}
// create a horizontal line across the screen
display.horizontalLine = function () {
    // get the available screen size
    const width = process.stdout.columns;
    var line = '';
    for (i = 0; i < width; i++) {
        line += '-';
    }
    console.log(line);
}
// create centered text on middle of the line
display.centered = function (str) {
    str = typeof (str) == 'string' && str.length > 0 ? str : '';
    // get the available screen size
    const width = process.stdout.columns;
    const leftPadding = Math.floor((width - str.length) / 2);
    var line = '';
    for (i = 0; i < leftPadding; i++) {
        line += ' ';
    }
    line += str;
    console.log(line);

}


// create a vertical space
display.verticalSpace = function (lines) {
    lines = typeof (lines) == 'number' && lines > 0 ? lines : 1;
    for (i = 0; i < lines; i++) {
        console.log('');
    }
}

// create a colored line text with object data information
display.objectLine = function( jsonObj ){
    //console.log("objectLine",jsonObj);
    var line = "";
    Object.keys(jsonObj).forEach(function(propName){
        line += '\x1b[34m' + propName + ': ' + '\x1b[0m' +jsonObj[propName] + ' ';
    });
    return line;
}


// Export
module.exports = display;