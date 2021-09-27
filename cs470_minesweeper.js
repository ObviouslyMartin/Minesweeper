var myTimer;
var strt = true;
var minesFound = 0;

//timer Functionality

function createTimer(width) {
    let minutes = 0, seconds = 0;
    // place the digits of the timer in the item whose
    // class-name is main-svg.
    const clock = d3.select('.main-svg').append('g')
        .attr('class', 'clock')
        .attr('transform', `translate(${width / 2}, 30)`)
        .append('text')
        .attr('class', 'clock-text')
        .attr('text-anchor', 'middle')
        .attr('font-size', 40)
        .attr('stroke', 'black')
        .attr('fill', 'black');

    function updateClock(clock, minutes, seconds) {
        // format the timer's text.
        clock.text(`${d3.format("02d")(minutes)}:${d3.format('02d')(seconds)}`);
    }

    updateClock(clock, 0, 0);  // display 0:0
    return function() {
        return d3.interval(() => {
            // Every second, add one to the seconds variable,
            // update the minute variable if necessary, and
            // update the text of the timer.
            seconds += 1;
            minutes += Math.floor(seconds / 60);
            seconds %= 60;
            updateClock(clock, minutes, seconds);
        }, 1000);
    };
}
function timerStart() {
    d3.select('body').append('svg').attr('width', 300).attr('height', 200).attr('class', 'main-svg');
    const timerFunction = createTimer(300);  // create and display the timer (doesn't start the timer.)
    myTimer = timerFunction(); // start the timer.

    // d3.timer(() => myTimer.stop(), 10000);  // stop it after 3 seconds.

}


//Minesweeper Game Functionality

function createConfigurationParameters(numRows, numColumns) {

    const configAttributes = {
        svg_width: 800,
        svg_height: 800,
        margins: {
            left: 20,
            right: 20,
            top: 50,
            bottom: 30
        },
        svg_margins: {
            top: 100,
            left: 100
        },
        board_cell_size: 40,
        board_cell_gap: 5,
        board_cell_stroke: 'steelblue',
        board_cell_fill: 'white',
        main_board_stroke: 'black',
        mine_circle_radius: 8,
        mine_size: 5,
    };

    configAttributes['svg_width'] = configAttributes.margins.left + configAttributes.margins.right +
        (configAttributes.board_cell_size + configAttributes.board_cell_gap) * numRows;
    configAttributes['svg_height'] = configAttributes.margins.top + configAttributes.margins.bottom +
        (configAttributes.board_cell_size + configAttributes.board_cell_gap) * numColumns;

    return configAttributes;
}
function playMinesweeper(rows, columns, percentageOfMines) {
    // create a two dimensional array with "rows" rows and "columns" columns.
    const board = d3.range(rows).map(d => []).map((row, i) => {
        return d3.range(columns).map((col, j) => ({
            row: i,
            column: j,
            adjacent_mines: 0,
            is_mine_cell: Math.random() <= percentageOfMines
        }))
    });
    console.log(board.length);
    const numMines = board.reduce((rowAccu, row) => rowAccu + row.reduce((colAccu, v) => colAccu + (v.is_mine_cell ? 1 : 0), 0), 0);
    console.log(`${numMines} mines were added to the board.`);

    const configAttrs = createConfigurationParameters(rows, columns);
    //notClickedCells = (rows * columns) - numMines;
    // create the main svg
    const svg = d3.select('body')
        .append('svg')
        .attr('class', 'main-svg')
        .attr('width', configAttrs.svg_width)
        .attr('height', configAttrs.svg_height)
        .attr('transform', `translate(${configAttrs.svg_margins.left}, ${configAttrs.svg_margins.top})`);


    // create the board
    const rowGroups = svg
        .selectAll('.row-group')
        .data(board)
        .enter()
        .append('g')
        .attr('class', 'row-group')
        .attr('transform', (d, i) => `translate(${configAttrs.margins.left}, 
                    ${configAttrs.margins.top + i * (configAttrs.board_cell_size + configAttrs.board_cell_gap)})`);

    const allCells = rowGroups.selectAll('.board-cell')
        .data(d => d)
        .enter()
        .append('g')
        .attr('class', d => `board-cell board-cell-g-${d.row}-${d.column}`)
        .attr('transform', (d, i) => `translate(${i * (configAttrs.board_cell_size + configAttrs.board_cell_gap)}, 0)`)
        // .attr('class', function(d){
        //     if(d.is_mine_cell){
        //         return 'mineCell';
        //     }
        //     else{
        //         return 'empty';
        //     }
        // });
        .classed('mineCell', function(d){ return d.is_mine_cell;});


    //add logic here for looping over cells to count adjacent miens?
    IntialAdjacentMines(board, rows, columns);
    // append rectangles and add click handlers.

    allCells.append('rect')
        .attr('width', configAttrs.board_cell_size)
        .attr('height', configAttrs.board_cell_size)
        .attr('stroke', configAttrs.board_cell_stroke)
        .attr('fill', configAttrs.board_cell_fill)
        .attr('class', 'board-rect')
        .on("click", function(d) { //left click
            d3.event.preventDefault();
            if (d.is_mine_cell && !d3.select(`.board-cell-g-${d.row}-${d.column}`).select('path').size() > 0){ // if mine cell, fill all remaining mineCells red. GAME OVER
                let allmines = d3.selectAll('.mineCell').selectAll('rect');
                    //.style('fill', 'red');
                console.log("Just before append: ", allmines);
                appendMineToSelection(d3.selectAll('.mineCell'), configAttrs);
                loose(configAttrs);
                // if(myTimer != null || myTimer != undefined) {
                //     myTimer.stop();
                // }

            }
            else if(d3.select(`.board-cell-g-${d.row}-${d.column}`).select('path').size() == 0){ //if a flag is placed on a cell, do not let the player reveal that cell
                d3.select(this)
                    .attr('fill', 'white')
                    .attr('class', 'clicked');
                //start game timer
                if(strt){
                    timerStart();
                    strt = false;
                }
                const f = d3.select(`.board-cell-g-${d.row}-${d.column}`);
                //.classed('clicked', true);

                if(d.adjacent_mines == 0) {
                    RevealEmpty(board, d.row, d.column);
                }
                else if(d.adjacent_mines >= 1){
                    f.classed('clicked', true);
                    drawNumAdjacentMines(d.adjacent_mines, f);
                }

                if(d3.selectAll('.clicked').filter('g').size() == ((rows*columns)-numMines)){win(configAttrs);} //PLAYER WINS
            }
            else{ //the cell has a flag on it so do not reveal it or any other around it or on the board
                //intentionally do nothing here...

            }

        })
        .on("contextmenu", function(d) {  // right-click
            d3.event.preventDefault(); // default is to bring up some option menu... we dont want that
            let g = d3.select(`.board-cell-g-${d.row}-${d.column}`);
            console.log("Is g a flag?: ",  g.select('path'));
            if(g.select('path').size() == 0){
                //console.log("board cell : ", g.classed(`flag-${d.row}-${d.column}`));
                g.append('path')
                    .attr('d', "M 0 0 L 3 0 L 3 25 M 3 0 L 15 8 L 3 15 L 3 25 L 0 25 L 0 0") //flag shape
                    .attr('transform', 'translate(12, 8)')
                    .attr('stroke', 'white')
                    .attr('stroke-width', 1)
                    .attr('fill', 'green')
                    .attr('class', `flag-${d.row}-${d.column}`);
                    //.classed(`flag-${d.row}-${d.column}`, true);
                console.log("g with path:: ", g.select('path'));

            }
            else{ //removed flag..?????????????????
                console.log("g removing flag: ",g);
                // g.select('.board-rect')
                //     .attr('fill', 'grey')
                //     .classed(`flag-${d.row}-${d.column}`, false);
                g.select('path').remove();
                g.select('.board-rect')
                    .attr('fill', 'grey')
                    .classed(`flag-${d.row}-${d.column}`, false);
            }

        });

    d3.selectAll('.board-rect')
        //.filter(d => d.row % 2 === 0 && d.column % 2 === 1 || d.row % 2 === 1 && d.column % 2 === 0) //checkerboard pattern
        .attr('fill', 'grey');

}

function IntialAdjacentMines(board, iRows, iColumns){
    //console.log(d3.select(".board-cell"));
    //console.log(rows, columns);
    for(let a = 0; a < iRows; a++) {
        for (let b = 0; b < iColumns; b++) {
            const cur = d3.select(`.board-cell-g-${b}-${a}`);
            if(cur != null) {
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        if(cur.data()[0] != null) {
                            //console.log("cur data: ", cur.data() + i);
                            let k = cur.data()[0].row + i;
                            let l = cur.data()[0].column + j;
                            if (k > -1 && k < iRows && l > -1 && l < iColumns) {

                                let adjacentCell = board[k][l];
                                //console.log("adjacentCell: ", adjacentCell);
                                if (adjacentCell != null) {
                                    if (adjacentCell.is_mine_cell) {
                                        board[cur.data()[0].row][cur.data()[0].column].adjacent_mines++;

                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

function RevealEmpty(board, dRows, dCols) {
    //let currCell = d3.select(`.board-cell-g-${dRows}-${dCol}`);//.select('.board-rect').classed('revealed');
    //console.log("currCell Revealed?: ", currCell.classed('revealed'));
    // console.log("dRows: ", dRows);
    // console.log("dCols: ", dCol);
    if(dRows < 0 || dCols < 0){return;}
    if(dRows >= rows || dCols >= columns){return;}

    let revealedRect = d3.select(`.board-cell-g-${dRows}-${dCols}`);
    //console.log("r: ", dRows, " c: ", dCols);
    if(board[dRows][dCols].adjacent_mines == 0 && !revealedRect.classed('clicked') && !board[dRows][dCols].is_mine_cell){
        revealedRect.select('.board-rect').attr('fill', 'white');
        revealedRect.classed('clicked', true);


        //notClickedCells--;
        if(dRows - 1 > -1 || dCols-1 > -1 || dRows+1 < rows || dCols+1 < columns) {
            RevealEmpty(board, dRows, dCols - 1);
            RevealEmpty(board, dRows, dCols + 1);
            RevealEmpty(board, dRows - 1, dCols);
            RevealEmpty(board, dRows + 1, dCols);

            RevealEmpty(board, dRows - 1, dCols - 1);
            RevealEmpty(board, dRows + 1, dCols - 1);
            RevealEmpty(board, dRows - 1, dCols + 1);
            RevealEmpty(board, dRows + 1, dCols + 1);
            //notClickedCells--;
        }
    }
    else if(board[dRows][dCols].adjacent_mines > 0 && !revealedRect.classed('clicked') && !board[dRows][dCols].is_mine_cell){

        revealedRect.select('.board-rect').attr('fill', 'white');
        revealedRect.classed('clicked', true);
        //notClickedCells--;
        drawNumAdjacentMines(board[dRows][dCols].adjacent_mines, revealedRect);

    }
        //if (dRows < 0 || dCol < 0 || currCell.adjacent_mines > 0)  {
        //     return;
        // }
        // else {
        //     for (let i = -1; i < 1; i = i + 2) {
        //         for (let j = -1; j < 1; j = j + 2) {
        //             let k = dRows + i;
        //             let l = dCols + j;
        //             if (k > -1 && k < rows && l > -1 && l < columns) {
        //
        //             }
        //         }
        //     }
        //
    //                 let adjacentCell = board[k][l];
    //                 let revealedRect = d3.select(`.board-cell-g-${k}-${l}`);
    //                 if (!adjacentCell.is_mine_cell && adjacentCell.adjacent_mines == 0 && !revealedRect.classed('clicked')) {
    //                     revealedRect.select('.board-rect').attr('fill', 'white');
    //                     revealedRect.classed('clicked', true);
    //                     //console.log(revealedRect);
    //                     RevealEmpty(board, k, l);
    //                 }
    //                 else if(!adjacentCell.is_mine_cell && adjacentCell.adjacent_mines > 0 && !revealedRect.classed('clicked')){
    //                     revealedRect.select('.board-rect').attr('fill', 'white');
    //                     revealedRect.classed('clicked', true);
    //                     console.log(revealedRect);
    //                     drawNumAdjacentMines(adjacentCell.adjacent_mines, revealedRect);
    //                     //RevealEmpty(board, k, l);
    //                 }
    //             }
}

function drawNumAdjacentMines(num, f){
    console.log("drawNumAdjacentMines::f ", num);
    if(!f.classed('.clicked')){
        f.classed('.clicked', true);
    }
    switch (num) {

        case 1:
            f.append('path') // draw number for adjacent mines
                .attr('d', "M 2 0 L 10 0 M 10 0 L 10 25 M 0 25 L 20 25")
                .attr('transform', 'translate(12, 8)')
                .attr('stroke', 'black')
                .attr('stroke-width', 1);
            //console.log("1111");
            break;
        case 2:
            f.append('path') // draw number for adjacent mines
                .attr('d', "M 0 0 L 15 0 M 15 0 L 15 10 M 15 10 L 0 10 M 0 10 L 0 20 M 0 20 L 15 20")
                .attr('transform', 'translate(12, 8)')
                .attr('stroke', 'black')
                .attr('stroke-width', 1);
            //console.log("222");
            break;
        case 3:
            f.append('path') // draw number for adjacent mines
                .attr('d', "M 0 0 L 10 0 M 10 0 L 10 10 M 10 10 L 0 10 M 10 10 L 10 20 M 10 20 L 0 20")
                .attr('transform', 'translate(12, 8)')
                .attr('stroke', 'black')
                .attr('stroke-width', 1);
            //console.log("3333");
            break;
        case 4:
            f.append('path') // draw number for adjacent mines
                .attr('d', "M 0 0 L 0 10 M 0 10 L 10 10 M 10 10 L 10 0 L 10 20")
                .attr('transform', 'translate(12, 8)')
                .attr('stroke', 'black')
                .attr('stroke-width', 1);
            //console.log("4444");

            break;
        case 5:
            f.append('path') // draw number for adjacent mines
                .attr('d', "M 10 0 L 0 0 M 0 0 L 0 10 M 0 10 L 10 10 M 10 10 L 10 20 M 10 20 L 0 20")
                .attr('transform', 'translate(12, 8)')
                .attr('stroke', 'black')
                .attr('stroke-width', 1);
            //console.log("5555");
            break;
        case 6:
            f.append('path') // draw number for adjacent mines
                .attr('d', "M 10 0 L 0 0 M 0 0 L 0 10 M 0 10 L 10 10 M 10 10 L 10 20 M 10 20 L 0 20 M 0 20 L 0 10")
                .attr('transform', 'translate(12, 8)')
                .attr('stroke', 'black')
                .attr('stroke-width', 1);
            //console.log("6666");
            break;
        case 7:
            f.append('path') // draw number for adjacent mines
                .attr('d', "M 0 0 L 10 0 M 10 0 L 8 20")
                .attr('transform', 'translate(12, 8)')
                .attr('stroke', 'black')
                .attr('stroke-width', 1);
            //console.log("7777");
            break;
        case 8:
            f.append('path') // draw number for adjacent mines
                .attr('d', "M 0 0 L 10 0 M 0 0 L 0 20 M 10 0 L 10 20 M 10 20 L 0 20 M 10 10 L 0 10")
                .attr('transform', 'translate(12, 8)')
                .attr('stroke', 'black')
                .attr('stroke-width', 1);
            //console.log("8888");
            break;
    }
}
function loose(configAttrs){
    const svg2 = d3.select('body')
        .append('svg2')
        .attr('class', 'main-svg')
        .attr('width', configAttrs.svg_width * 5)
        .attr('height', configAttrs.svg_height * 5)
        .attr('transform', `translate(${configAttrs.svg_margins.left * 4}, ${configAttrs.svg_margins.top  * 4})`)
        .text("YOU LOOSE");
    const svg3 = d3.select('body')
        .append('svg2')
        .attr('class', 'main-svg')
        .attr('width', configAttrs.svg_width * 5)
        .attr('height', configAttrs.svg_height * 5)
        .attr('transform', `translate(${configAttrs.svg_margins.left * 5}, ${configAttrs.svg_margins.top * 5 })`)
        .text(" CLICK TO PLAY AGAIN")
        .on("click", function(d){
            d3.event.preventDefault();
            console.log( d3.selectAll(".clock"));
            d3.selectAll(".main-svg").remove();
            d3.selectAll(".clock").remove();
            //d3.selectAll("svg").filter('main-svg').remove();
            // d3.selectAll("svg2 ").remove();
            // d3.selectAll("svg3").remove();
            strt = true;
            playMinesweeper(rows, columns, percentageOfMines);
        });


    //d3.selectAll('.mineCell').selectAll('rect')
        //.style('fill', 'red');
    appendMineToSelection(d3.selectAll('.mineCell'), configAttrs);
    if(myTimer!= null || myTimer != undefined){
        myTimer.stop();
    }
}
function win(configAttrs) {

    const svg2 = d3.select('body')
        .append('svg2')
        .attr('class', 'main-svg')
        .attr('width', configAttrs.svg_width*2)
        .attr('height', configAttrs.svg_height*2)
        .attr('transform', `translate(${configAttrs.svg_margins.left}, ${configAttrs.svg_margins.top})`)
        .text("YOU WIN");
    const svg3 = d3.select('body')
        .append('svg2')
        .attr('class', 'main-svg')
        .attr('width', configAttrs.svg_width*2)
        .attr('height', configAttrs.svg_height*2)
        .attr('transform', `translate(${configAttrs.svg_margins.left}, ${configAttrs.svg_margins.top})`)
        .text(" CLICK TO PLAY AGAIN")
        .on("click", function(d){
            d3.event.preventDefault();
            console.log( d3.selectAll(".clock"));
            d3.selectAll(".main-svg").remove();
            d3.selectAll(".clock").remove();
            //d3.selectAll("svg").filter('main-svg').remove();
            // d3.selectAll("svg2 ").remove();
            // d3.selectAll("svg3").remove();
            strt = true;
            playMinesweeper(rows, columns, percentageOfMines);
        });


    // d3.selectAll('.mineCell').selectAll('rect')
    //     .style('fill', 'red');
    appendMineToSelection(d3.selectAll('.mineCell'), configAttrs);
    if(myTimer!= null || myTimer != undefined){
        myTimer.stop();
    }


}
function appendMineToSelection(selection, configAttrs) {
    // const {
    //     mine_circle_radius, // 8
    //     mine_size, // 5
    // } = configAttrs;
    console.log("appendMines::", selection);
    selection.append('circle')
        .attr('r', configAttrs.mine_circle_radius)
        // .attr('cx', configAttrs.board_cell_size/2)
        // .attr('cy', configAttrs.board_cell_size/2)
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('fill', 'red');
    console.log("pos::",configAttrs.mine_circle_radius + configAttrs.mine_size);
    d3.range(4).forEach((d, i) =>
        selection.append('line')
            .attr('x1', -(configAttrs.mine_circle_radius + configAttrs.mine_size))
            .attr('y1', 0)
            .attr('x2', configAttrs.mine_circle_radius + configAttrs.mine_size)
            .attr('y2', 0)
            .attr('stroke-width', 3)
            .attr('stroke', 'red')
            .attr('transform', `rotate(${i * 45})`)

    );
    console.log("fin::")
}