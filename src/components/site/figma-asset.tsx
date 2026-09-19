type FigmaAssetProps = {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
};

export function FigmaAsset({ src, alt = "", width, height, className }: FigmaAssetProps) {
  return <img src={src} alt={alt} width={width} height={height} className={className} />;
}
