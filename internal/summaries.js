define([
    "plot-scripts/utils",
], function(
    utils
){
//////////////////////////////////////////////////////////////////////////////

const SUMMARIES = {};

async function writeSummary(options){
    const dataset = await $.get(options.url);
    var parsed = utils.parseCasesOfStatesCSV(dataset, options.datasetType);

    console.log(parsed);

}




SUMMARIES["德国简报"] = async () => await writeSummary({
    url: "{{ site.dataset["covid-19-de"] }}",
    countryName: "德国",
    regionType: "州",
    datasetType: "covid19-eu-zh",
});






return SUMMARIES;


//////////////////////////////////////////////////////////////////////////////
});
