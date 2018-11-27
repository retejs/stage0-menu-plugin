import sass from 'rollup-plugin-sass';

export default {
    input: 'src/index.js',
    name: 'Stage0MenuPlugin',
    globals: {
        'stage0': 'stage0',
        'stage0/reconcile': 'stage0'
    },
    plugins: [
        sass({
            insert: true
        })
    ]
}