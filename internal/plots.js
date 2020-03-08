define([
    "plot-scripts/infection-time-series-logy",
    "plot-scripts/infection-time-series-stacked",
], function(
    regfunc1,
    regfunc2,
){
    const PLOTS = [];

    regfunc1(PLOTS);
    regfunc2(PLOTS);


    return PLOTS;
});
