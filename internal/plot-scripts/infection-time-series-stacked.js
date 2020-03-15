define([
    "gnuplot_update",
    "plot-scripts/utils",
], function(
    GNUPLOT_UPDATE,
    utils
){
//////////////////////////////////////////////////////////////////////////////

var ORDER_OF_STATES = [];
const CUTOFF_DIVISION = 20;



var CUTOFF_STATE = ORDER_OF_STATES[0];

function findCutoffState(data){
    var ts = Object.keys(data);
    ts.sort();
    var d = data[ts[ts.length-1]]; // newest data
    var sum = 0;
    for(var i=0; i<ORDER_OF_STATES.length; i++) sum += d[ORDER_OF_STATES[i]];
    var cutoffSize = sum * 0.9;

    //var cutoffSize = d[ORDER_OF_STATES[0]] / 20;

    for(var i=0; i<ORDER_OF_STATES.length; i++){
        cutoffSize -= d[ORDER_OF_STATES[i]];
        if(cutoffSize <= 0) {
            CUTOFF_STATE = ORDER_OF_STATES[i];
            return;
        }
/*        if(d[ORDER_OF_STATES[i]] <= cutoffSize){
            CUTOFF_STATE = ORDER_OF_STATES[i];
            return;
        }*/
    }
}

function trimStackedRowData(stackedNumbers){
    /*
        Outputs a new row, cut off stacked numbers at TOTAL / 10, counts lower
        then that is replaced by "others"
    */
    var outputRow = {"others": 0};
    var cut = false,
        cutoff = stackedNumbers[ORDER_OF_STATES[0]] / CUTOFF_DIVISION;

    for(var i=0; i<ORDER_OF_STATES.length; i++){
        if(ORDER_OF_STATES[i] == CUTOFF_STATE){
            outputRow["others"] = stackedNumbers[ORDER_OF_STATES[i]];
            break;
        } else {
            outputRow[ORDER_OF_STATES[i]] = stackedNumbers[ORDER_OF_STATES[i]];
        }
    }
    return outputRow;
}




function stackedCSVGen(input, datasetType){
    /* Format the data collected from project "covid19-eu-data", as:
        datetime,state,total_of_state_1,total_of_state_1+2,total_of_state_1+2+3
    
       which is good for stacked chart.*/

    var parsed = utils.parseCasesOfStatesCSV(input, datasetType);
    var data = parsed.cases;
    ORDER_OF_STATES = parsed.states;

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

    var output = [];
    var cutoffState = findCutoffState(data);

    for(var datetime in data){
        // count stacked numbers for all states
        var stackedNumbers = {};
        var count = 0;
        for(var i=ORDER_OF_STATES.length-1; i>=0; i--){
            count += (data[datetime][ORDER_OF_STATES[i]] || 0);
            stackedNumbers[ORDER_OF_STATES[i]] = count;
        }

        // output a row, with cut-off numbers
        var outputRow = trimStackedRowData(stackedNumbers);

        // write a line to output
        var outputRowStr = datetime.toString();
        outputRowStr += "," + outputRow["others"];
        for(var i=0; i<ORDER_OF_STATES.length; i++){
            outputRowStr += "," + (outputRow[ORDER_OF_STATES[i]] !== undefined ? outputRow[ORDER_OF_STATES[i]] : "x");
        }
        output.push(outputRowStr);

    }

    return output.join("\n");
    // Germany have 16 federal states:
    //    datetime,others,sum_of_1-16,sum_of_1-15,sum_of-1-14,...
}




async function doPlot(options){ // url, countryName, datasetType){
    utils.getColor.reset();
    
    const dataset = await $.get(options.url);

    const files = {
        // data files being fed to GNUPLOT
        "data.csv": stackedCSVGen(dataset, options.datasetType)
    };


    var instruction = `
        set terminal svg size 600,400 enhanced fname 'arial'  fsize 10 butt solid
        set output 'out.svg'

        set datafile separator ","

        set timefmt "%s"
        set xdata time
        set format x "%m月\\n%d日"
        set style fill solid 1.0

        set key left nobox noopaque noautotitle maxrows 6
        set ytics mirror
        set y2tics
        set grid ytics xtics
        set grid front
    `;
    instruction += "set title \"" + options.countryName + "各" + options.regionType + " COVID-19 感染人数\"\n";

    var plotcmd = [];

    for(var i=0; i<ORDER_OF_STATES.length; i++){
        plotcmd.push([
            "\"data.csv\"",
            "using 1:" + (i+3) + " with filledcurves x1",
            "lc rgb '" + utils.getColor() + "'",
            "title \"" + ORDER_OF_STATES[i] + "\"",
        ].join(" "));
    }
    plotcmd.push([
        "\"data.csv\"",
        "using 1:2 with filledcurves x1",
        "lc rgb '#CCCCCC'",
        "title \"其他\"",
    ].join(" "));

    instruction += "plot " + plotcmd.join(", ");


    console.log(instruction);
    
    GNUPLOT_UPDATE(files, instruction); 
};


return function(PLOTS){

    const baseurl = "https://covid19-eu-data-cache.now.sh/";

    PLOTS["德国感染人数统计图(堆积)"] = async () => await doPlot({
        //url: "https://raw.githubusercontent.com/covid19-eu-zh/covid19-eu-data/master/dataset/covid-19-de.csv",
        url: baseurl + "covid-19-de.csv",
        countryName: "德国",
        regionType: "州",
        datasetType: "covid19-eu-zh",
    });

    PLOTS["奥地利感染人数统计图(堆积)"] = async () => await doPlot({
        url: baseurl + "covid-19-at.csv",
        countryName: "奥地利",
        regionType: "州",
        datasetType: "covid19-eu-zh",
    });

    PLOTS["意大利感染人数统计图(堆积)"] = async () => await doPlot({
//        url: "https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-province/dpc-covid19-ita-province.csv",
        url: "https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-regioni/dpc-covid19-ita-regioni.csv",
        countryName: "意大利",
        regionType: "大区",
        datasetType: "pcm-dpc",
    });

/*    PLOTS["法国感染人数统计图(堆积)"] = async () => await doPlot({
        url: "https://www.lefigaro.fr/fig-data/coronavirus/data/data.csv",
        countryName: "法国",
        regionType: "大区",
        datasetType: "lefigaro.fr",
    });*/

    PLOTS["法国感染人数统计图(堆积)"] = async () => await doPlot({
        url: baseurl + "covid-19-fr.csv",
        countryName: "法国",
        regionType: "大区",
        datasetType: "covid19-eu-zh",
    });

};



//////////////////////////////////////////////////////////////////////////////
});
