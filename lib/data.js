/*
* Library for storing and editing data
*
*/

// Dependencies
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

const rf=function(dir,file){
    return path.format({
        dir: _data.baseDir+dir,
        base: file ? file+'.json' : undefined
    });
}
// Container for the module 
var _data = {}

// Define base directory for Starage folder
_data.baseDir = path.join(__dirname,'/../data/');

// write data to a file
_data.create = function(dir, file, data, callback){
    // open file for writing
    fs.open(rf(dir,file),'wx', function(err,fileDescriptor){
        if(!err && fileDescriptor){
            // Convert data to string
            const stringData = JSON.stringify(data);

            // Write to file & close it
            fs.writeFile(fileDescriptor,stringData,function(err){
                if(!err){
                    fs.close(fileDescriptor,function(err){
                        if(!err){
                            callback(null);
                        }else{
                            callback('Error closing new file');
                        }
                    })
                }else{
                    callback('Error writing to new file')
                }
            })
        }else {
            callback('Cound not create new file, it may already exist');
        }
    });
};


_data.read = function(dir,file,callback){
    const filepath = rf(dir,file);
    fs.readFile(filepath,'utf8',function(err,data){
        if(!err && data){
            var parsedData = helpers.parseJsonToObject(data);
            callback(err,parsedData);
        }else{
            callback(err,data);
        }
    });
}

// update data to a file
_data.update = function(dir, file, data, callback){
    // open file for writing
    fs.open(rf(dir,file),'r+', function(err,fileDescriptor){
        if(!err && fileDescriptor){
            // Convert data to string
            const stringData = JSON.stringify(data);

            // truncate the file
            fs.ftruncate(fileDescriptor,function(err){
                if(!err){
                    // Write to file & close it
                    fs.writeFile(fileDescriptor,stringData,function(err){
                        if(!err){
                            fs.close(fileDescriptor,function(err){
                                if(!err){
                                    callback(null);
                                }else{
                                    callback('Error closing existing file');
                                }
                            })
                        }else{
                            callback('Error writing to existing file')
                        }
                    })
                }else{
                    callback('Error truncating file')
                }
            });
        }else {
            callback('Cound not open file for updating, it may not exist yet');
        }
    });
};


// delete a data file
_data.delete = function(dir, file, callback){
    // open file for writing
    fs.unlink(rf(dir,file), function(err,fileDescriptor){
        if(!err){
            callback(null);
        }else{
            callback("Error deleting file");
        }
    });
};

// List all the items in a directory
_data.list = function(dir,callback){
    fs.readdir(rf(dir),function(err,data){
        if(!err && data && data.length >0){
            var trimmedFileNames = [];
            data.forEach(function(fileName){
                trimmedFileNames.push(fileName.replace('.json',''));
            });
            callback(false,trimmedFileNames);
        }else{
            callback(err,data);
        }
    })
}


module.exports = _data;