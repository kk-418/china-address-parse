/**
 * Application entry point
 */

// Load application styles
import 'styles/index.scss';
import AddressParse from './lib/address-parse'
import $ from 'jquery'

const parse = () => {
    let mode = 0
    const onTextAreaBlur = (e) => {
        const address = e.target.value
        const parseResult = AddressParse(address, { mode, textFilter: [] })
        console.log(parseResult)
        $('#result').empty();
        $('#result').append(`<ul>${Object.entries(parseResult).map(([k, v]) => `<li>${k}：${v}</li>`).join('')}</ul>`)
    }
    $('#addressContent').bind('input propertychange', onTextAreaBlur)

    $('#addressList li').on('click', (e) => {
        $('#addressContent').val(e.target.innerText)
        $('#addressContent')[0].dispatchEvent(new Event('input'));
    })

    $('#selectMode').val(mode)
    $('#selectMode').change((e) => {
        mode = Number(e.target.value)
    })
}

parse()
