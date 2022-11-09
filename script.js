(async () => {
  // GRAB DATA
  const data = await d3.tsv(
    "./data.tsv",
    function parseData({ outcome, decision, name, sequence }) {
      return {
        outcome,
        decision,
        name,
        sequence: sequence.split(""),
      };
    }
  );

  function shuffle(array) {
    let currentIndex = array.length,
      randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex],
        array[currentIndex],
      ];
    }

    return array;
  }

  // SLICE DATA
  const slicedData = shuffle(data).slice(0, 50);

  // DIMENSIONS AND CONSTANTS
  const chartDiv = document.getElementById("chart");

  const ANGLE_START = -0.5 * Math.PI;
  const ANGLE_STEP = 0.066 * Math.PI;
  const ANGLE_STEP_DECAY = 1;
  const SEGMENT_LENGTH = 50;
  const SEGMENT_LENGTH_DECAY = 0.95;

  const dims = {
    height: 900,
    width: 1300,
  };

  const start = { x: dims.width / 2, y: dims.height };

  // ADD DIMENSIONS TO CHART
  const svg = d3
    .select(chartDiv)
    .attr("height", dims.height)
    .attr("width", dims.width);

  // CODE TO CONSTRUCT A LINE FROM SEQUENCE
  const getLine = (data) => {
    const testData = data.sequence;
    // loop through sequence
    for (var i = 0; i < testData.length; i++) {
      const previousIndex = testData[i - 1];
      const firstIdx = i === 0;

      // current angle and length are based on angle
      // and length of previous array element
      var angle = firstIdx ? ANGLE_START : previousIndex.angle;
      var angleStep = firstIdx ? ANGLE_STEP : previousIndex.angleStep;
      var length = firstIdx ? SEGMENT_LENGTH : previousIndex.length;

      // if vote is 'Keep', make angle skew left
      // if vote is 'Delete', make angle skew right
      if (testData[i] === "K") {
        angle -= angleStep;
      } else {
        angle += angleStep;
      }

      // x1 and y1 of line are based
      // on the end of previous line
      var xEndPrev = firstIdx ? start.x : previousIndex.x2;
      var yEndPrev = firstIdx ? start.y : previousIndex.y2;

      // x2 and y2 are calculated based on length and angle
      var xEnd = xEndPrev + Math.cos(angle) * length;
      var yEnd = yEndPrev + Math.sin(angle) * length;

      // now that we know our coordinates, we slightly
      // modify angle and length for next pass through
      angleStep *= ANGLE_STEP_DECAY;
      length *= SEGMENT_LENGTH_DECAY;

      // determine line segment color based on vote
      var color = testData[i] === "K" ? "green" : "purple";

      // store all this data to the array so we can
      // paint it all to the SVG after computing
      testData[i] = {
        x1: xEndPrev,
        y1: yEndPrev,
        x2: xEnd,
        y2: yEnd,
        angle,
        angleStep,
        length,
        name: data.name,
        outcome: data.outcome,
        fill: color,
      };
    }

    return testData;
  };

  const lines = slicedData.map(getLine);

  // ZOOM
  function handleZoom(e) {
    // apply transform to the chart
    var test = d3.select("g#zoomEl").attr("transform", e.transform);
  }

  let zoom = d3.zoom().scaleExtent([0.6, 5]).on("zoom", handleZoom);

  svg.call(zoom);

  // BORDER
  svg
    .append("rect")
    .attr("height", dims.height)
    .attr("width", dims.width)
    .attr("fill", "none")
    .attr("stroke-width", 2)
    .attr("stroke", "black");

  // ADD LINE GROUPS TO CHART
  const chart = svg
    .append("g")
    .attr("id", "zoomEl")
    .selectAll("g.line")
    .data(lines)
    .join((enter) => enter.append("g").attr("class", "line"));

  // // ADD LINES TO GROUPS
  const articles = chart
    .selectAll("line")
    .data((d) => d)
    .join((enter) =>
      enter
        .append("line")
        .attr("x1", (d) => d.x1)
        .attr("y1", (d) => d.y1)
        .attr("x2", (d) => d.x2)
        .attr("y2", (d) => d.y2)
        .attr("stroke", (d) => d.fill)
        .attr("stroke-width", 4)
    );

  // const articles = chart
  //   .selectAll("h1")
  //   .data((d) => d)
  //   .join((enter) =>
  //     enter
  //       .append("circle")
  //       .attr("cx", (d) => d.x1)
  //       .attr("cy", (d) => d.y1)
  //       .attr("x2", (d) => d.x2)
  //       .attr("y2", (d) => d.y2)
  //       .attr("fill", (d) => d.fill)
  //       .attr("r", 4)
  //   );

  // ADD HOVER EFFECT
  articles
    .on("mouseover", (e, d) => {
      var info = document.getElementById("info");
      d3.selectAll("g.line")
        .attr("opacity", 0.25)
        .attr("filter", "brightness(0.75");
      d3.select(e.path[1])
        .attr("opacity", 1)
        .attr("filter", "brightness(1.5")
        .raise();
      info.innerHTML = d.name + " - Outcome: " + d.outcome;
    })
    .on("mouseout", () => {
      var info = document.getElementById("info");
      d3.selectAll("g.line").attr("opacity", 1).attr("filter", "brightness(1");
      info.innerHTML = "";
    });
})();
