---
---
define([
    "gnuplot_update",
    "./utils",
], function(
    GNUPLOT_UPDATE,
    utils
){
//////////////////////////////////////////////////////////////////////////////

var ORDER_OF_STATES = [];
var OUTPUT_COLS = 0;

async function CSVGen(input, datasetType){
    var data = {};


    var parsed = await utils.parseCasesOfStatesCSV(input, datasetType);
    var data = parsed.cases;
    ORDER_OF_STATES = parsed.states;

    var MAX = 0;
    for(var datetime in data){
        for(var statename in data[datetime]){
            if(!isNaN(data[datetime][statename])){
                if(MAX < data[datetime][statename]){
                    MAX = data[datetime][statename];
                }
            }
        }
    }

    var timestamps = Object.keys(data);
    timestamps.sort();
    var newestTimestamp = timestamps[timestamps.length-1];

    // determine order of states, lower index -> larger number
    var newestData = data[newestTimestamp];
    ORDER_OF_STATES.sort(function(state1, state2){
        var c1 = (newestData[state1] !== undefined ? newestData[state1] : 0),
            c2 = (newestData[state2] !== undefined ? newestData[state2] : 0);
        return c2 - c1;
    });

    var CUTOFF_STATE = ORDER_OF_STATES[ORDER_OF_STATES.length-1];
    for(var i=0; i<ORDER_OF_STATES.length; i++){
        if(data[newestTimestamp][ORDER_OF_STATES[i]] < MAX / 20){
            CUTOFF_STATE = ORDER_OF_STATES[i];
            OUTPUT_COLS = i + 1;
            break;
        }
    }

    var output = [];

    for(var datetime in data){
        // write a line to output
        var outputRowStr = datetime.toString();
        for(var i=0; i<ORDER_OF_STATES.length; i++){
            outputRowStr += "," + data[datetime][ORDER_OF_STATES[i]];
            if(CUTOFF_STATE == ORDER_OF_STATES[i]) break;
        }
        output.push(outputRowStr);

    }

    return output.join("\n");
}




async function doPlot(options){ //url, countryName, datasetType){
    utils.getColor.reset();
    
    const dataset = await $.get(options.url);

    const files = {
        // data files being fed to GNUPLOT
        "data.csv": await CSVGen(dataset, options.datasetType)
    };


    var instruction = `
        set terminal svg size 600,400 enhanced fname 'arial'  fsize 10 butt solid
        set output 'out.svg'

        set datafile separator ","

        set timefmt "%s"
        set xdata time
        set format x "%m月\\n%d日"
        set style fill solid 1.0


        set logscale yy2

        set key inside left top maxcols 1
        set ytics mirror
        set y2tics
        set grid front mytics xtics
        set mytics 10
    `;

    instruction += "set title \"" + options.countryName + "各" + options.regionType + " COVID-19 感染人数\"\n";

    var plotcmd = [];

    for(var i=0; i<OUTPUT_COLS; i++){
        plotcmd.push([
            "\"data.csv\"",
            "using 1:" + (i+2) + " with linespoints",
            "lc rgb '" + utils.getColor() + "'",
            "lw 2",
            "title \"" + ORDER_OF_STATES[i] + "\"",
        ].join(" "));
    }

    instruction += "plot " + plotcmd.join(", ");


    console.log(instruction);
    
    GNUPLOT_UPDATE(files, instruction); 
};





return function(PLOTS){

    PLOTS["德国感染人数统计图(Y-对数)"] = async () => await doPlot({
        url: "{{ site.dataset["covid-19-de"] }}",
        countryName: "德国",
        regionType: "州",
        datasetType: "covid19-eu-zh",
    });

    PLOTS["奥地利感染人数统计图(Y-对数)"] = async () => await doPlot({
        url: "{{ site.dataset["covid-19-at"] }}",
        countryName: "奥地利",
        regionType: "州",
        datasetType: "covid19-eu-zh",
    });

    PLOTS["意大利感染人数统计图(Y-对数)"] = async () => await doPlot({
        url: "{{ site.dataset["italy-dpc"] }}",
        countryName: "意大利",
        regionType: "大区",
        datasetType: "pcm-dpc",
    });

    PLOTS["法国感染人数统计图(Y-对数)"] = async () => await doPlot({
        url: "{{ site.dataset["covid-19-fr"] }}",
        countryName: "法国",
        regionType: "大区",
        datasetType: "covid19-eu-zh@authority",
    });

    PLOTS["荷兰感染人数统计图(Y-对数)"] = async () => await doPlot({
        url: "{{ site.dataset["covid-19-nl"] }}",
        countryName: "荷兰",
        regionType: "省",
        datasetType: "covid19-eu-zh@city",
    });

};

//////////////////////////////////////////////////////////////////////////////
});
