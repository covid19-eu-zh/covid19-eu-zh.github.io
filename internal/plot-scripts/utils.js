define([], function(){
//////////////////////////////////////////////////////////////////////////////
var ret = {};

ret.normalizeStateName = function(n){
    n = n.replace("-", "").replace(" ", "").toLowerCase();
    n = n.replace("ü", "ue").replace("ä", "ae").replace("ö", "oe");
    return {
        // Deutschland
        "nordrheinwestfalen": "Nordrhein-Westfalen",
        "badenwuerttemberg" : "Baden-Württemberg",
        "bayern": "Bayern",
        "berlin": "Berlin",
        "niedersachsen": "Niedersachsen",
        "brandenburg": "Brandenburg",
        "bremen": "Bremen",
        "hamburg": "Hamburg",
        "hessen": "Hessen",
        "mecklenburgvorpommern": "Mecklenburg-Vorpommern",
        "rheinlandpfalz": "Rheinland-Pfalz",
        "saarland": "Saarland",
        "sachsen": "Sachsen",
        "schleswigholstein": "Schleswig-Holstein",
        "thueringen": "Thüringen",
        "sachsenanhalt": "Sachsen-Anhalt",

        // Oesterreich
        "vorarlberg": "Vorarlberg",
        "kaernten": "Kärnten",
        "burgenland": "Burgenland",
        "oberoesterreich": "Oberösterreich",
        "niederoesterreich": "Niederösterreich",
        "wien": "Wien",
        "tirol": "Tirol",
        "salzburg": "Salzburg",
        "steiermark": "Steiermark",

    }[n];
};



var colorId = -1;
function getColor(){
    const colors = [
        "#FF0000",
        "#00FF00",
        "#9900FF",
        "#FFCC00",
        "#0000FF",
        "#00FFFF",
        "#FF00FF",
    ];
    colorId += 1;
    return colors[colorId % colors.length];
}
getColor.reset = function(){ colorId = -1 };
ret.getColor = getColor;


return ret;
//////////////////////////////////////////////////////////////////////////////
});
