define(["gnuplot_api"], function(gnuplot){
//////////////////////////////////////////////////////////////////////////////

gnuplot.init('gnuplot.js');
gnuplot.lastListing = [];


function GNUPLOT_UPDATE(datafiles, instruction){
    gnuplot.putFile("script.txt", instruction);
    for(var filename in datafiles){
        //gnuplot.putFile("data.txt", data);
        gnuplot.putFile(filename, datafiles[filename]);
    }

    gnuplot.run(["script.txt"], function(e){
        updateListing(true);

        /*gnuplot.lastListing.forEach(function(filename){
            gnuplot.removeFile(null, filename);
        });
        gnuplot.lastListing = [];*/
    });
}



function updateListing(updateImages) {
    if (!gnuplot.worker) return;
	
    gnuplot.getListing(function(e) {
        var l = e.content; // newest file listing
        gnuplot.lastListing = l;

        // Search for an image
        if (!updateImages) return;

        const filetypes = {
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".gif": "image/gif",
            ".svg": "image/svg+xml",
        };

        $("#saveimage").attr("disabled", true);
        for(var nameidx in l){
            var name = l[nameidx];
            for(var nameext in filetypes){
                if(name.search(nameext) <= 0) continue;
                // a file found with wanted filetype

                gnuplot.getFile(name, function(e){
                    if(!e.content) {
                        console.error("Output file " + name + " not retrieved.");
                        return;
                    }
                    toGnuplotImage(e.content, filetypes[nameext]);
                            
                    var gpi = $("#gnuplotImage")[0];
                    var canv = $("#gnuplotCanvas")[0];
                    //gpi.style.width="100%";
                    
                    setTimeout(function() {
                        canv.width = gpi.width;
                        canv.height = gpi.height;
                
                        setTimeout(function() {
                            var ctx = canv.getContext("2d");

                            ctx.fillStyle = "#FFFFFF";
                            ctx.fillRect(0, 0, canv.width, canv.height);

                            ctx.drawImage(gpi, 0, 0);
                            $("#gnuplotRaster")[0].src = canv.toDataURL("image/png");
                            gpi.style.width="100%";

                            $("#saveimage").removeAttr("disabled");
                        }, 200)
                    }, 200);

                });
	    };
	};
    });
}

function toGnuplotImage(data, mimestring) {
    var img = document.getElementById('gnuplotImage');
    try {
        var ab = new Uint8Array(data);
        var blob = new Blob([ab], {"type": mimestring});
        window.URL = window.URL || window.webkitURL;
        var urlBlob = window.URL.createObjectURL(blob);
        img.src = urlBlob;
        return urlBlob;
    } catch (err) { // in case blob / URL missing, fallback to data-uri
        if (!window.blobalert) {
            alert('Warning - your browser does not support Blob-URLs, using data-uri with a lot more memory and time required. Err: ' + err);
            window.blobalert = true;
        }
        var rstr = '';
        for (var i = 0; i < e.content.length; i++)
            rstr += String.fromCharCode(e.content[i]);
        img.src = 'data:'+mimestring+';base64,' + btoa(rstr);
    }
};


//arrayBuffer to array for JSON.stringify
function abToArray(ab) {
	var bb = new Uint8Array(ab);
	var arr = new Array(bb.length);
	for (var i=0; i < bb.length; i++)
		arr[i] = bb[i];
	return arr;
}

//array to ab 
function arrayToAb(arr) {
	return new Uint8Array(arr).buffer;
}







gnuplot.onOutput = function(text) {
	gnuplot.onError(text);
};

gnuplot.onError = function(text) {
	$("#outDiv").removeClass("hidden");
	gnuplot.text = gnuplot.text + "<br>" + text;
	$("#gnuplotOut").html(gnuplot.text);
};




return GNUPLOT_UPDATE;

//////////////////////////////////////////////////////////////////////////////
});
