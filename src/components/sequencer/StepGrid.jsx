import { NOTE_LANES, STEPS } from '../../engine/sequencer/constants';

export default function StepGrid({ lane, steps, currentStep, dispatch }) {
  return (
    <div className="step-row">
      <div className="lane-name">{lane}</div>
      <div className="steps-grid">
        {Array.from({ length: STEPS }, (_, index) => {
          const step = steps[index];
          return (
            <button
              key={index}
              className={`step ${step.active ? 'active' : ''} ${currentStep === index ? 'current' : ''}`}
              onClick={() => dispatch({ type: 'TOGGLE_STEP', lane, index })}
              title={`${lane} step ${index + 1}`}
            >
              <span>{index + 1}</span>
              {NOTE_LANES.includes(lane) && step.note != null ? <em>{step.note}</em> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
