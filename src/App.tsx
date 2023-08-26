import React, { useEffect, useState } from 'react'
import { Card, newTableau } from './spider'
import './App.css'

const getCardImage = (c: Card): {front: string, back: string} => {
    const suits_image = {
        'Harts': 'H',
        'Tiles': 'D',
        'Clovers': 'C',
        'Spades': 'S',
    }
    const rank_image = ['0', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    
    if (c.face == "down") {
        return {
            front: '/cards/RED_BACK.svg', 
            back: `/cards/${rank_image[c.rank]}${suits_image[c.suit]}.svg`,
        };
    }
    else {
        return {
            front: `/cards/${rank_image[c.rank]}${suits_image[c.suit]}.svg`,
            back: '/cards/RED_BACK.svg',
        };
    }
}

type StockProps = {
    cards: Card[],
    onDealout: () => void,
}

/**
 * Card Stock
 * @param param0 
 */
function Stock({cards, onDealout}: StockProps ) {
    const stock = cards.map((card, row) => {
        const card_img = getCardImage(card).front;
        if (row == 0) {
            return (<img
                    src={card_img}
                    className='card'
                    style={{marginLeft: "0px"}}
                    key={row}
                    onClick={() => onDealout()}
                />)
        } 
        else {
            return (<img
                    className='card'
                    src={card_img}
                    key={row}
                    onClick={() => onDealout()}
                />)
        }
    });
    if (cards.length == 0) {
        return (
            <div id="stock">
                <svg><rect className="emptycard" x="0" y="0" /></svg>
            </div>)
    }
    else {
        return (<div id="stock">{stock}</div>);
    }
}

type TableauProps = {
    piles: Card[][],
    onSelect: (event: React.MouseEvent<HTMLImageElement, MouseEvent>, pile: number, row: number) => void,
    onDestination: (pile: number) => void,
    showMessage: boolean,
    onRestart: () => void,
}

function Tableau ({piles, onSelect, onDestination, showMessage, onRestart}: TableauProps) {
    const html_piles = piles.map((pile, col) => {
        let cards = pile.map((card, row) => {
            const card_img = getCardImage(card);
            if (row == 0) {
                return (<img
                        src={card_img.front}
                        className="card"
                        key={row}
                        style={{marginTop: '0px'}}
                        onMouseDown={(e) => onSelect(e, col, row)}
                    />);
            }
            else {
                return (
                    <div className="flip-card" key={row} >
                        <img
                            src={card_img.front}
                            className="flip-card-front"
                            onMouseDown={(e) => {onSelect(e, col, row)}}
                        />
                        <img
                            src={card_img.back}
                            className="flip-card-back"
                        />
                    </div>
                );
            }
        });
        if (cards.length == 0) {
            cards = [(() => {
                return (
                    <svg  key="empty">
                        <rect
                            className="emptycard" x="0" y="0"
                            onMouseUp={(e) => {e.stopPropagation(); onDestination(col)}}
                        />
                    </svg>);
            })()];
        }
        return (<div
                className="pile"
                key={col}
                onMouseUp={(e) => {e.stopPropagation(); onDestination(col)}}
            >{cards}</div>);
    });
    return (
        <div className="tableau">
            {html_piles}
            {showMessage && 
                <div className="message" onClick={() => onRestart()}>
                    <div className="text">YOU WON!</div>
                </div>
            }
        </div>);
}

function MovingPile() {
    return <div id="movingpile"></div>;
}

type movingPileProps = {
    pile: Card[],
    src: number | null,
}

const newMovingPile = () => {
    let movingPile: HTMLElement | null = null;
    const diff = {
        x: 0,
        y: 0,
    };
    const props: movingPileProps = {
        pile: [],
        src: null,
    }
    
    const set = (cards: Card[], src: number, offsetLeft: number, offsetTop: number, pageX: number, pageY: number) => {
        movingPile = document.getElementById('movingpile');
        if (!movingPile) {
            console.log('emement ID "movingpile" not found');
            return;
        }
        diff.x = pageX - offsetLeft;
        diff.y = pageY - offsetTop;
        movingPile.innerHTML = '';
        cards.forEach((card, i) => {
            const img = document.createElement('img');
            img.src = getCardImage(card).front;
            if (i == 0) {
                img.style.marginTop = '0px';
            }
            img.classList.add('card');
            if (movingPile) movingPile.appendChild(img);
        });
        movingPile.style.left = (pageX - diff.x) + "px";
        movingPile.style.top = (pageY - diff.y) + "px";
        movingPile.style.display = 'flex';
        console.log(`pile: ${cards.map((c) => c.rank + c.suit)}`);
        props.pile.push(...cards);
        props.src = src;
    }

    /**
     * Move the moving pile
     * @param pageX mouse position X
     * @param pageY mouse position Y
     * @returns void
     */
    const move = (pageX: number, pageY: number) => {
        if (!movingPile) return;
        if (movingPile?.innerHTML == '') return;
        movingPile.style.left = (pageX - diff.x) + "px";
        movingPile.style.top = (pageY - diff.y) + "px";
    }

    /**
     * Remove the moving pile
     * @returns Cards in the moving pile and its original position
     */
    const remove = (): movingPileProps | null => {
        if (!movingPile) {
            return null;
        }
        movingPile.innerHTML = '';
        movingPile.style.display = 'none';
        movingPile = null;
        console.log('remove movingpile');
        return {pile: props.pile.splice(0), src: props.src};
    }

    return {
        set: set,
        move: move,
        remove: remove,
    };
}

let tableau = newTableau();
tableau.dealOut();
tableau.startHistory();
const MPile = newMovingPile();

function showPile(pile: Card[]) {
    pile.forEach((c) => {
        console.log(`${c.rank}.${c.suit}`);
    });
}

function Table () {
    const [piles, setPiles] = useState(tableau.piles);
    const [stock, setStock] = useState(tableau.cards);
    const [foundations, setFoundations] = useState<Card[]>([]);
    const [youWon, setYouWon] = useState(false);

    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            event.preventDefault();
            MPile.move(event.pageX, event.pageY);
        }
        
        const handleMouseUp = (event: MouseEvent) => {
            event.stopPropagation();
            console.log(`mup out of tableau`);
            MPile.remove();
            tableau.putdownPile(null); // null: cancel moving pile
            setPiles(JSON.parse(JSON.stringify(tableau.piles)));
        }
        
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
    }, []);

    function onUndo() {
        tableau.popHistory();
        setStock(JSON.parse(JSON.stringify(tableau.cards)));
        setPiles(JSON.parse(JSON.stringify(tableau.piles)))
    }

    function onDealout() {
        console.log("onDealout");
        const completePiles = tableau.dealOut().map((c) => c.card);
        setStock(JSON.parse(JSON.stringify(tableau.cards)));
        setPiles(JSON.parse(JSON.stringify(tableau.piles)));
        setFoundations([...foundations, ...completePiles]);
        win();
    }

    function onSelect(event: React.MouseEvent<HTMLImageElement, MouseEvent>, pile: number, row: number) {
        if (event.target == null) return;
        if (!tableau.pickupPile(pile, row)) return;

        const flipable = true;
        const [targetOffsetLeft, targetOffsetTop] = (() => {
            if (flipable) {
                const p = (event.target as HTMLElement).parentElement;
                if (p == null) return [null, null];
                return [p.offsetLeft, p.offsetTop];
            }
            else {
                return [
                    (event.target as HTMLElement).offsetLeft,
                    (event.target as HTMLElement).offsetTop
                ];
            }
        })();
        if (targetOffsetLeft == null || targetOffsetTop == null) return;
        console.log(`mouse pos: ${targetOffsetLeft}, ${targetOffsetTop}`);

        setPiles(JSON.parse(JSON.stringify(tableau.piles)));
        MPile.set(tableau.moving.cards, pile, targetOffsetLeft, targetOffsetTop, event.pageX, event.pageY);
    }

    function onDestination(pile: number) {
        console.log(`****destination pile: ${pile}`);
        MPile.remove();
        const completePiles = tableau.putdownPile(pile).map((c) => c.card);
        setFoundations([...foundations, ...completePiles]);
        setPiles(JSON.parse(JSON.stringify(tableau.piles)));
        win();
    }

    function win() {
        console.log('win');
        if (tableau.isTableauClean()) {
            console.log('YOU WON!');
            setYouWon(true);
        }
    }

    function onRestart() {
        tableau = newTableau();
        tableau.dealOut();
        tableau.startHistory();
        setYouWon(false);            
        setPiles(tableau.piles);
        setStock(tableau.cards);
        setFoundations([]);
    }
    
    return (<div className="table">
        <Button onUndo={onUndo} />
        <div id="firstRow">
            <Stock cards={stock} onDealout={onDealout} />
            <Foundations cards={foundations} />
        </div>
        <Tableau 
            piles={piles} 
            onSelect={onSelect}
            onDestination={onDestination}
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

type FoundationsProps = {
    cards: Card[],
}

function Foundations({cards}: FoundationsProps) {
    const foundations = cards.map((card, i) => {
        const card_img = getCardImage(card).front;
        if (i == 0) {
            return <img src={card_img} className='card' key={i} />;
        }
        else {
            return <img src={card_img} className='card' style={{marginLeft: "-5vw"}} key={i} />;
        }
    });
    return <div id="foundations">{foundations}</div>;
}

function App() {
    return (<div><Table /></div>);
}

export default App
