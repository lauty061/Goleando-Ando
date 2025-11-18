class TournamentBracket {
    constructor(containerId, data) {
        this.container = document.getElementById(containerId);
        this.data = data;
    }

    generateBracket(rounds) {
        if (!this.container) {
            console.error('Container not found');
            return;
        }

        const bracketHTML = `
            <div class="bracket-container">
                <div class="bracket-wrapper">
                    ${this.generateRounds(rounds)}
                    ${this.generateWinner(rounds)}
                </div>
            </div>
        `;

        this.container.innerHTML = bracketHTML;
    }

    generateRounds(rounds) {
        const roundNames = Object.keys(rounds);
        return roundNames.map(roundName => {
            const matches = rounds[roundName];
            return `
                <div class="bracket-round">
                    <div class="round-title">${this.translateRound(roundName)}</div>
                    ${matches.map(match => this.generateMatch(match)).join('')}
                </div>
            `;
        }).join('');
    }

    generateMatch(match) {
        const isEmptyMatch = (!match.team1 || match.team1 === '') && (!match.team2 || match.team2 === '');
        
        if (isEmptyMatch) {
            return `
                <div class="bracket-match tbd-match">
                    <div class="match-team tbd">
                        <div class="team-info">
                            <span class="team-name tbd-text">A confirmar</span>
                        </div>
                    </div>
                    ${this.generateMatchInfo(match)}
                </div>
            `;
        }
        
        const team1Winner = this.isWinner(match.team1_score, match.team2_score);
        const team2Winner = this.isWinner(match.team2_score, match.team1_score);

        return `
            <div class="bracket-match">
                ${this.generateTeam(match.team1, match.team1_logo, match.team1_score, team1Winner)}
                ${this.generateTeam(match.team2, match.team2_logo, match.team2_score, team2Winner)}
                ${this.generateMatchInfo(match)}
            </div>
        `;
    }

    generateTeam(name, logo, score, isWinner) {
        const isTBD = !name || name === 'TBD' || name === 'Por definir';
        const winnerClass = isTBD ? 'tbd' : (isWinner ? 'winner' : (score !== null ? 'loser' : ''));
        const displayName = name || 'Por definir';
        const displayScore = score !== null && score !== undefined ? score : '-';

        return `
            <div class="match-team ${winnerClass}">
                <div class="team-info">
                    <img src="${logo || 'https://via.placeholder.com/30'}" 
                        alt="${displayName}" 
                        class="team-logo"
                        onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg'">
                    <span class="team-name" title="${displayName}">${displayName}</span>
                </div>
                <span class="team-score">${displayScore}</span>
            </div>
        `;
    }

    generateMatchInfo(match) {
        if (!match.date && !match.status) return '';
        
        const statusHTML = match.status ? `<span class="match-status">${match.status}</span>` : '';
        const dateHTML = match.date ? `<span>${match.date}</span>` : '';
        
        return `
            <div class="match-date">
                ${statusHTML}
                ${dateHTML}
            </div>
        `;
    }

    generateWinner(rounds) {
        const finalRound = rounds['Final'] || rounds['final'];
        if (!finalRound || finalRound.length === 0) return '';

        const finalMatch = finalRound[0];
        const winner = this.getMatchWinner(finalMatch);

        if (!winner) return '';

        return `
            <div class="bracket-winner">
                <div class="winner-label">Campeón</div>
                <div class="winner-team">
                    <img src="${winner.logo}" 
                        alt="${winner.name}" 
                        class="winner-logo"
                        onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg'">
                    <div class="winner-name">${winner.name}</div>
                </div>
            </div>
        `;
    }

    getMatchWinner(match) {
        if (!match.team1 || !match.team2) return null;
        
        const score1 = parseInt(match.team1_score);
        const score2 = parseInt(match.team2_score);

        if (isNaN(score1) || isNaN(score2)) return null;

        if (score1 > score2) {
            return { name: match.team1, logo: match.team1_logo };
        } else if (score2 > score1) {
            return { name: match.team2, logo: match.team2_logo };
        }

        return null;
    }

    isWinner(teamScore, opponentScore) {
        if (teamScore === null || teamScore === undefined || 
            opponentScore === null || opponentScore === undefined) {
            return false;
        }
        return parseInt(teamScore) > parseInt(opponentScore);
    }

    translateRound(roundName) {
        const translations = {
            'round_of_16': 'Octavos de Final',
            'round16': 'Octavos de Final',
            'octavos': 'Octavos de Final',
            'quarter_finals': 'Cuartos de Final',
            'quarters': 'Cuartos de Final',
            'cuartos': 'Cuartos de Final',
            'semi_finals': 'Semifinal',
            'semis': 'Semifinal',
            'semifinal': 'Semifinal',
            'final': 'Final',
            'finals': 'Final'
        };

        return translations[roundName.toLowerCase()] || roundName;
    }

    showEmpty() {
        this.container.innerHTML = `
            <div class="bracket-empty">
                <div class="bracket-empty-text">No hay datos de llave disponibles</div>
            </div>
        `;
    }

    showLoading() {
        this.container.innerHTML = `
            <div class="bracket-container">
                <div class="bracket-wrapper bracket-skeleton">
                    <div class="bracket-round">
                        <div class="round-title">Cargando...</div>
                    </div>
                </div>
            </div>
        `;
    }
}

function convertFixtureToBracket(fixtureData) {
    const rounds = {};
    
    const knockoutPhases = [
        'octavos', 'octavo', 'round of 16', 'round_of_16',
        'cuartos', 'cuarto', 'quarter', 'quarters',
        'semi', 'semifinal', 'semis',
        'final', 'finals'
    ];
    
    const tempRounds = {};
    
    fixtureData.forEach(match => {
        const phase = match.fase || match.fase_torneo || match.fecha_torneo;
        if (!phase) return;

        const phaseLower = phase.toLowerCase();
        const isKnockout = knockoutPhases.some(keyword => 
            phaseLower.includes(keyword)
        );
        
        if (!isKnockout) return;

        if (!tempRounds[phase]) {
            tempRounds[phase] = [];
        }

        tempRounds[phase].push({
            team1: match.local,
            team1_logo: match.escudo_local,
            team1_score: match.goles_local !== '-' ? parseInt(match.goles_local) || 0 : 0,
            team2: match.visitante,
            team2_logo: match.escudo_visita,
            team2_score: match.goles_visita !== '-' ? parseInt(match.goles_visita) || 0 : 0,
        });
    });

    for (const phase in tempRounds) {
        const matches = tempRounds[phase];
        const combinedMatches = combineHomeAwayMatches(matches);
        rounds[phase] = combinedMatches;
    }

    return ensureCompleteBracket(rounds);
}

function ensureCompleteBracket(rounds) {
    const bracketStructure = {
        'Octavos de Final': 8,
        'Cuartos de Final': 4,
        'Semifinal': 2,
        'Final': 1
    };

    const existingPhases = {};
    for (const phase in rounds) {
        const phaseLower = phase.toLowerCase();
        if (phaseLower.includes('octavos') || phaseLower.includes('octavo')) {
            existingPhases['Octavos de Final'] = rounds[phase];
        } else if (phaseLower.includes('cuartos') || phaseLower.includes('cuarto') || phaseLower.includes('quarter')) {
            existingPhases['Cuartos de Final'] = rounds[phase];
        } else if (phaseLower.includes('semi')) {
            existingPhases['Semifinal'] = rounds[phase];
        } else if (phaseLower.includes('final') && !phaseLower.includes('semi') && !phaseLower.includes('octavos') && !phaseLower.includes('cuartos')) {
            existingPhases['Final'] = rounds[phase];
        }
    }

    const completeBracket = {};
    
    for (const [phaseName, matchCount] of Object.entries(bracketStructure)) {
        if (existingPhases[phaseName]) {
            completeBracket[phaseName] = existingPhases[phaseName];
            const currentCount = existingPhases[phaseName].length;
            if (currentCount < matchCount) {
                for (let i = currentCount; i < matchCount; i++) {
                    completeBracket[phaseName].push(createEmptyMatch());
                }
            }
        } else {
            completeBracket[phaseName] = [];
            for (let i = 0; i < matchCount; i++) {
                completeBracket[phaseName].push(createEmptyMatch());
            }
        }
    }

    return completeBracket;
}

function createEmptyMatch() {
    return {
        team1: '',
        team1_logo: '',
        team1_score: null,
        team2: '',
        team2_logo: '',
        team2_score: null,
    };
}

function combineHomeAwayMatches(matches) {
    const matchPairs = {};
    const combined = [];

    matches.forEach(match => {
        const teams = [match.team1, match.team2].sort();
        const key = teams.join('_vs_');

        if (!matchPairs[key]) {
            matchPairs[key] = [];
        }
        matchPairs[key].push(match);
    });

    for (const key in matchPairs) {
        const pair = matchPairs[key];
        
        if (pair.length === 1) {
            combined.push(pair[0]);
        } else if (pair.length >= 2) {
            const match1 = pair[0];
            const match2 = pair[1];
            
            const teams = [match1.team1, match1.team2].sort();
            const isMatch1First = match1.team1 === teams[0];
            
            let totalTeam1 = 0;
            let totalTeam2 = 0;
            
            if (isMatch1First) {
                totalTeam1 = match1.team1_score + match2.team2_score;
                totalTeam2 = match1.team2_score + match2.team1_score;
            } else {
                totalTeam1 = match1.team2_score + match2.team1_score;
                totalTeam2 = match1.team1_score + match2.team2_score;
            }
            
            combined.push({
                team1: teams[0],
                team1_logo: isMatch1First ? match1.team1_logo : match1.team2_logo,
                team1_score: totalTeam1,
                team2: teams[1],
                team2_logo: isMatch1First ? match1.team2_logo : match1.team1_logo,
                team2_score: totalTeam2,
            });
        }
    }

    return combined;
}

async function loadBracket(jsonPath, containerId) {
    const bracket = new TournamentBracket(containerId);
    bracket.showLoading();

    try {
        const response = await fetch(jsonPath);
        const data = await response.json();
        
        const ligaName = Object.keys(data)[0];
        const ligaData = data[ligaName];

        if (!ligaData.fixture || ligaData.fixture.length === 0) {
            bracket.showEmpty();
            return;
        }

        const rounds = convertFixtureToBracket(ligaData.fixture);

        if (Object.keys(rounds).length === 0) {
            bracket.showEmpty();
            return;
        }

        bracket.generateBracket(rounds);
    } catch (error) {
        console.error('Error loading bracket:', error);
        bracket.showEmpty();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TournamentBracket, convertFixtureToBracket, loadBracket };
}
