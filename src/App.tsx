import { useState } from "react";
import { Card, CompPile, newTableau } from "./spider";
import "./App.css";
import Tableau from "./Tableau";
import Foundations from "./Foundations";
import MovingPile from "./MovingPile";
import Stock from "./Stock";
import { flipedCard, Flip } from "./utils";

let tableau = newTableau();
tableau.dealOut();
tableau.startHistory();
let previousPiles: Card[][] = JSON.parse(JSON.stringify(tableau.piles));

function Table () {
    const [piles, setPiles] = useState<{piles: Card[][], flip: Flip}>({piles: tableau.piles, flip: []});
    const [stock, setStock] = useState(tableau.cards);
    const [foundations, setFoundations] = useState<CompPile[]>([]);
    const [youWon, setYouWon] = useState(false);

    function onUndo() {
        tableau.popHistory();
        setStock(JSON.parse(JSON.stringify(tableau.cards)));
        setPiles({piles: JSON.parse(JSON.stringify(tableau.piles)), flip: []});
    }

    function onDealout() {
        const completePiles = tableau.dealOut();
        // all dealouted cards are flippable
        const flip = tableau.piles.map((pile, i) => {
            return {pile: i, row: pile.length - 1, from: "stock"};
        })
        setStock(JSON.parse(JSON.stringify(tableau.cards)));
        setPiles({piles: JSON.parse(JSON.stringify(tableau.piles)), flip: flip});
        setFoundations(f => [...f, ...completePiles]);
    }
    
    function onMovePile(src: {pile: number, row: number}, dest: number) {
        const completePiles = tableau.movePile(src, dest);
        const flip = flipedCard(tableau.piles, previousPiles);
        previousPiles = JSON.parse(JSON.stringify(tableau.piles));
        setPiles({piles: JSON.parse(JSON.stringify(tableau.piles)), flip: flip});
        setFoundations(f => [...f, ...completePiles]);
    }

    function win() {
        if (tableau.isTableauClean()) {
            setYouWon(true);
        }
    }

    function onRestart() {
        tableau = newTableau();
        tableau.dealOut();
        tableau.startHistory();
        setYouWon(false);            
        setPiles({piles: tableau.piles, flip: []});
        setStock(tableau.cards);
        setFoundations([]);
    }
    
    return (
        <div className="table">
            <Button onUndo={onUndo} />
            <div id="firstRow">
                <Stock cards={stock} onDealout={onDealout} />
                <Foundations cards={foundations} win={win}/>
            </div>
            <Tableau 
                piles={piles} 
                onMovePile={onMovePile}
                showMessage={youWon}
                onRestart={onRestart}
            />
            <MovingPile />
        </div>
    );
}

type ButtonProps = {
    onUndo: () => void,
}

function Button({onUndo}: ButtonProps) {
    return <button onClick={()=>onUndo()}>Undo</button>
}

function App() {
    return (<div><Table /></div>);
}

export default App
