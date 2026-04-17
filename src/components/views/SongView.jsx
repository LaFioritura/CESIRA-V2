import { SECTION_LIBRARY } from '../../engine/song/sections';
import Panel from '../ui/Panel';

export default function SongView({ session, dispatch }) {
  return (
    <div className="view-grid song-grid">
      <Panel title="Arrangement">
        <div className="arrangement-strip">
          {session.arrangement.map((section, index) => (
            <button key={`${section}-${index}`} className={`segment ${session.currentSection === section ? 'active' : ''}`} onClick={() => dispatch({ type: 'SET_SECTION', sectionId: section })}>
              {section}
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Section Focus">
        <div className="actions-grid">
          {SECTION_LIBRARY.map((section) => (
            <button key={section.id} className={`action-btn ${session.currentSection === section.id ? 'primary' : ''}`} onClick={() => dispatch({ type: 'SET_SECTION', sectionId: section.id })}>
              {section.label}
            </button>
          ))}
        </div>
      </Panel>
    </div>
  );
}
