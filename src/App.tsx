import { useState, useEffect, MouseEvent } from "react";
import { Card, CompPile, SPIDER_MODE_EASY, SPIDER_MODE_HARD, SPIDER_MODE_MEDIUM, SpiderMode, newTableau } from "./spider";
import "./App.css";
import Tableau from "./Tableau";
import Foundations from "./Foundations";
import MovingPile from "./MovingPile";
import Stock from "./Stock";
import { flipedCard, Flip, preloadImages } from "./utils";

// prevent text selection by pointer
document.onselectstart = () => { return false; };

let spiderMode: SpiderMode = SPIDER_MODE_MEDIUM;
let tableau = newTableau(spiderMode);
tableau.dealOut();
tableau.startHistory();
let previousPiles: Card[][] = JSON.parse(JSON.stringify(tableau.piles));

interface ShowNewDialog {
    show: boolean,
    cancel: (e: MouseEvent) => void,
    ok: (e: MouseEvent) => void,
}

function Table () {
    const [piles, setPiles] = useState<{piles: Card[][], flip: Flip}>({piles: [], flip: []});
    const [stock, setStock] = useState<Card[]>([]);
    const [foundations, setFoundations] = useState<CompPile[]>([]);
    const [showMessage, setShowMessage] = useState({message: "♠♥♣♦", on: () => {}});
    const [showNewDialog, setShowNewDialog] = useState<ShowNewDialog>({show: false, ok: () => {}, cancel: () => {}});

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
        previousPiles = JSON.parse(JSON.stringify(tableau.piles));
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
        tableau = newTableau(spiderMode);
        tableau.dealOut();
        tableau.startHistory();
        setShowMessage({message: "", on: () => {}});
        setPiles({piles: tableau.piles, flip: []});
        setStock(tableau.cards);
        setFoundations([]);
    }

    function onNew() {
        const ok = (event: MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();
            tableau = newTableau(spiderMode);
            tableau.dealOut();
            tableau.startHistory();
            setPiles({piles: tableau.piles, flip: []});
            setStock(tableau.cards);
            setFoundations([]);
            setShowNewDialog({show: false, ok: () => {}, cancel: () => {}});
        }
        const cancel = (event: MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();
            // update event listener
            setPiles({piles: JSON.parse(JSON.stringify(tableau.piles)), flip: []});
            setShowNewDialog({show: false, ok: () => {}, cancel: () => {}});
        }
        // clean up flip animations
        setPiles({piles: tableau.piles, flip: []});
        setShowNewDialog({
            show: true,
            ok: ok,
            cancel: cancel,
        });
    }
    
    return (
        <div className="table">
            <div id="buttons">
                <ButtonNew  onNew={onNew} />
                <ButtonUndo onUndo={onUndo} />
            </div>
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
            {showNewDialog.show &&
                <div className="dialog" onClick={showNewDialog.cancel}>
                    <div className="new-dialog-content" >
                        <div>Select Game Mode</div>
                        <div id="mode">
                            <div className="mode-button" onClick={(e) => {spiderMode = SPIDER_MODE_EASY; showNewDialog.ok(e);}}>EASY</div>
                            <div className="mode-button" onClick={(e) => {spiderMode = SPIDER_MODE_MEDIUM; showNewDialog.ok(e);}}>MEDIUM</div>
                            <div className="mode-button" onClick={(e) => {spiderMode = SPIDER_MODE_HARD; showNewDialog.ok(e);}}>HARD</div>
                        </div>
                    </div>
                </div>
            }
        </div>
    );
}

type ButtonUndoProps = {
    onUndo: () => void,
}

function ButtonUndo({onUndo}: ButtonUndoProps) {
    return <button className="button-undo" onClick={()=>onUndo()}>Undo</button>
}

type ButtonNewProps = {
    onNew: () => void,
}

function ButtonNew({onNew}: ButtonNewProps) {
    return <button className="button-new" onClick={()=>onNew()}>New</button>
}

function App() {
    return (<div><Table /></div>);
}

export default App
