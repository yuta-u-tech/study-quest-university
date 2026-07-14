import { useState } from 'react'

interface ItemMediaProps {
  media?: { image?: string; audio?: string; animation?: 'logic-not' }
}

function LogicNotAnimation() {
  const [inputHigh, setInputHigh] = useState(false)
  const outputHigh = !inputHigh

  return (
    <section className="logic-animation" aria-label="NOT回路の動作アニメーション">
      <div className="logic-animation-head">
        <p className="logic-animation-kicker">Interactive circuit</p>
        <h3>NOT回路を動かして確かめる</h3>
        <p>入力を切り替えると、トランジスタの状態・LED・出力が連動して変化する。</p>
      </div>
      <div className="logic-animation-controls" role="group" aria-label="入力電圧">
        <button type="button" className={!inputHigh ? 'is-active' : ''} onClick={() => setInputHigh(false)}>
          入力 Low (0)
        </button>
        <button type="button" className={inputHigh ? 'is-active' : ''} onClick={() => setInputHigh(true)}>
          入力 High (1)
        </button>
      </div>
      <div className={`logic-circuit ${inputHigh ? 'is-on' : 'is-off'}`}>
        <div className="logic-state logic-input-state"><span>入力 V_in</span><strong>{inputHigh ? 'High / 1' : 'Low / 0'}</strong></div>
        <div className="logic-wire logic-base-wire" aria-hidden="true" />
        <div className="logic-transistor"><span>NPN</span><i aria-hidden="true" /><strong>{inputHigh ? 'ON' : 'OFF'}</strong></div>
        <div className="logic-wire logic-collector-wire" aria-hidden="true" />
        <div className="logic-state logic-output-state"><span>出力 V_out</span><strong>{outputHigh ? 'High / 1' : 'Low / 0'}</strong></div>
        <div className="logic-led"><i aria-hidden="true" /><span>LED {inputHigh ? '点灯' : '消灯'}</span></div>
      </div>
      <p className="logic-animation-result">
        {inputHigh
          ? 'ベース電流が流れてトランジスタがONになる。出力は0 V付近となり Low (0) である。'
          : 'ベース電流が流れずトランジスタはOFFである。出力はV_CC付近となり High (1) である。'}
      </p>
    </section>
  )
}

/** 問題に添付された図・写真（パスは public/data/ からの相対） */
export default function ItemMedia({ media }: ItemMediaProps) {
  if (media?.animation === 'logic-not') return <LogicNotAnimation />
  if (!media?.image) return null
  return (
    <img
      className="item-image"
      src={`${import.meta.env.BASE_URL}data/${media.image}`}
      alt="問題の図"
      loading="lazy"
    />
  )
}
