import * as fs from 'node:fs';
import * as path from 'node:path';

function addJsExtension(dir) {
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);

        if (fs.statSync(filePath).isDirectory()) {
            addJsExtension(filePath); // 再帰的にディレクトリを探索
        } else if (path.extname(filePath) === '.js') {
            let data = fs.readFileSync(filePath, 'utf8');

            // import文のfromがローカルパスかどうか確認して処理
            data = data.replace(/(import .*? from ['"])(.*?)(['"])/g, (match, p1, p2, p3) => {
                // ローカルファイルまたはディレクトリへの相対パスかどうかを確認
                if (p2.startsWith('./') || p2.startsWith('../')) {
                    const importPath = path.join(path.dirname(filePath), p2);

                    // ディレクトリの場合は /index.js を追加
                    if (fs.existsSync(importPath) && fs.statSync(importPath).isDirectory()) {
                        return `${p1}${p2}/index.js${p3}`;
                    }
                    // ファイルの場合で .js 拡張子がなければ追加
                    else if (!p2.endsWith('.js')) {
                        return `${p1}${p2}.js${p3}`;
                    }
                }

                // npm パッケージの場合はそのまま
                return match;
            });

            // ファイルを上書き
            fs.writeFileSync(filePath, data, 'utf8');
        }
    });
}

addJsExtension(process.argv[2]);
