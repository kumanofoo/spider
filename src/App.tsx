import { useState, useEffect } from "react";
import { Card, CompPile, newTableau } from "./spider";
import "./App.css";
import Tableau from "./Tableau";
import Foundations from "./Foundations";
import MovingPile from "./MovingPile";
import Stock from "./Stock";
import { flipedCard, Flip, preloadImages } from "./utils";

// prevent text selection by pointer
document.onselectstart = () => { return false; };

let tableau = newTableau();
tableau.dealOut();
tableau.startHistory();
let previousPiles: Card[][] = JSON.parse(JSON.stringify(tableau.piles));

function Table () {
    const [piles, setPiles] = useState<{piles: Card[][], flip: Flip}>({piles: [], flip: []});
    const [stock, setStock] = useState<Card[]>([]);
    const [foundations, setFoundations] = useState<CompPile[]>([]);
    const [showMessage, setShowMessage] = useState({message: "♠♥♣♦", on: () => {}});

    useEffect(() => {
        preloadImages(tableau.cards, "both").then(() => {
            // done preloading images
            setPiles({piles: tableau.piles, flip: []});
            setStock(tableau.cards);
            setShowMessage({message: "", on: () => {}});
        })
    }, []);

    function onUndo() {
        tableau.popHistory();
        setStock(JSON.parse(JSON.stringify(tableau.cards)));
        setPiles({piles: JSON.parse(JSON.stringify(tableau.piles)), flip: []});
        setFoundations(tableau.foundations.map((card) => {
            return {card: card, pile: -1}}
        ));
    }

    function onDealout() {
        const previous = tableau.cards.length;
        const completePiles = tableau.dealOut();
        // when dealout was not done, do nothing  
        if (previous == tableau.cards.length) return;

        // all dealouted cards are flippable
        const flip = tableau.piles.map((pile, i) => {
            return {pile: i, row: pile.length - 1, from: "stock"};
        })
        setStock(JSON.parse(JSON.stringify(tableau.cards)));
        setPiles({piles: JSON.parse(JSON.stringify(tableau.piles)), flip: flip});
        if (completePiles.length > 0) {
            setFoundations(f => [...f, ...completePiles]);
        }
    }
    
    function onMovePile(src: {pile: number, row: number}, dest: number) {
        const completePiles = tableau.movePile(src, dest);
        const flip = flipedCard(tableau.piles, previousPiles);
        previousPiles = JSON.parse(JSON.stringify(tableau.piles));
        setPiles({piles: JSON.parse(JSON.stringify(tableau.piles)), flip: flip});
        if (completePiles.length > 0) {
            setFoundations(f => [...f, ...completePiles]);
        }
    }

    function win() {
        if (tableau.isTableauClean()) {
            setShowMessage({message: "YOU WON!", on: onRestart});
        }
    }

    function onRestart() {
        tableau = newTableau();
        tableau.dealOut();
        tableau.startHistory();
        setShowMessage({message: "", on: () => {}});            
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
            />
            <MovingPile />
            {showMessage.message != "" &&
                <div className="message" onClick={showMessage.on}>
                    <div className="text">{showMessage.message}</div>
                </div>
            }
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
