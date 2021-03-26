import ThemeMap from '../const/theme.js'
import createDonutChartCard from '../templates/donut-chart-card.js'
import { writeSVG } from '../utils/file-writer.js'
import getRepoLanguage from '../github-api/repos-per-language.js'

const createReposPerLanguageCard = async function (username) {
    const langMap = await getRepoLanguage(username)
    let langData = []

    // make a pie data
    for (const [key, value] of langMap) {
        langData.push({
            name: key,
            value: value.count,
            color: value.color,
        })
    }
    langData.sort(function (a, b) {
        return b.value - a.value
    })
    langData = langData.slice(0, 5) // get top 5

    for (const themeEntry of ThemeMap.entries()) {
        const svgString = createDonutChartCard(
            'Top Languages by Repo',
            langData,
            themeEntry[1]
        )
        // output to folder, use 1- prefix for sort in preview
        writeSVG(themeEntry[0], '1-repos-per-language', svgString)
    }
}

export default createReposPerLanguageCard
