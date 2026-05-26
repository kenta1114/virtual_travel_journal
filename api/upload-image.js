export default function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if(req.method==='OPTIONS'){
    return res.status(204).end();
  }

  //405 guard- ここが本番で欠けていると Vercel がデフォルト 405 を返す
  if(req.method !=='POST'){
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({error:'Method Not Allowed'});
  }

  // 外部ストレージ未設定の場合は null を返すだけ（保存フローを止めない）
  const { dataurl } = req.body??{};


  if(!dataUrl){
    return res.status(400).json({ error:'dataUrl is required'});
  }

  // VITE_ 変数はサーバー側では参照不可。Vercel 環境変数を直接使う。
  const uploadUrl = process.env.IMAGE_UPLOAD_URL;
  const uploadPreset = process.env.IMAGE_UPLOAD_PRESET;

  if(!uploadUrl){
    // 外部アップロード未設定 → null を返して呼び出し元がスキップできるようにする
    return res.status(200).json({ url:null });
  }

  // Cloudinary などへのアップロードは呼び出し元 (TravelJournal.tsx) の
  // uploadImageToStorage() で VITE_IMAGE_UPLOAD_URL を使って直接行う設計のため、
  // このエンドポイントは「フォールバック確認用」として url: null を返すのみ。
  // 将来サーバーサイドアップロードに変更する場合はここに実装する。
  return res.status(200).json({url:null, uploadUrl, uploadPreset});
}