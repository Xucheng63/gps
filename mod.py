from lxml import etree
from shapely.geometry import Point, Polygon
import shapely.wkt

def find_green_polygon_center(polygons):
    # 假设Green多边形的名称包含"Green"
    for name, polygon in polygons.items():
        if "Green" in name:
            # 计算多边形的中心坐标
            # 这里使用多边形的代表点（centroid），它通常是多边形的几何中心
            center = polygon.centroid
            return (center.x, center.y)
    return None  # 如果没有找到包含"Green"的多边形，返回None


def parse_kml_and_extract_ids(file_path):
    tree = etree.parse(file_path)
    root = tree.getroot()
    ns = {'kml': 'http://www.opengis.net/kml/2.2'}
    folder_ids = {}

    # Assume that the name attribute of each Folder contains information about the Hole, such as "Hole 1".
    for folder in root.findall('.//kml:Folder', ns):
        folder_id = folder.get('id')
        folder_name = folder.find('kml:name', ns)
        if folder_name is not None:
            hole_number = folder_name.text.replace("Hole ", "")  # Suppose the name of the Folder is "Hole 1", "Hole 2",...
            try:
                hole_number = int(hole_number)  #Convert to an integer
                folder_ids[hole_number] = folder_id
            except ValueError:
                pass  #If the conversion fails (for example, it is not a number), it is skipped

    return folder_ids
def swap_point_coordinates(point):
    return Point(point.y, point.x)

def parse_kml(file_path, hole):
    tree = etree.parse(file_path)
    root = tree.getroot()
    ns = {'kml': 'http://www.opengis.net/kml/2.2'}  
    print("Parsing KML file...")
    polygons = {}

    # Filter the folders based on the selected holes
    folder_name = parse_kml_and_extract_ids(file_path).get(hole)
    for folder in root.findall('.//kml:Folder', ns):
        if folder.get('id') == folder_name:
            for placemark in folder.findall('.//kml:Placemark', ns):
                name = placemark.find('kml:name', ns).text
                coordinates_element = placemark.find('kml:Polygon/kml:outerBoundaryIs/kml:LinearRing/kml:coordinates', ns)
                if coordinates_element is not None:
                    coords = coordinates_element.text.strip()
                    coord_pairs = coords.split()
                    points = [(float(pair.split(',')[0]), float(pair.split(',')[1])) for pair in coord_pairs]
                    polygon = Polygon(points)
                    polygons[name] = polygon

    return polygons

def find_polygon(polygons, point):
    point = Point(point)
    point=swap_point_coordinates(point)
    for name, polygon in polygons.items():
        if polygon.contains(point):
            return name
    return "No matching polygon found."


file_path = "Atkins Golf Club3.kml"
hole_number = 1
polygons = parse_kml(file_path, hole_number)
#print(find_green_polygon_center(polygons))
# Enter a coordinate point
input_point = (40.0909140, -88.1703157)
#print(f"The point {input_point} is inside the polygon: {find_polygon(polygons, input_point)}")
#input_point=(float(input("Enter the latitude: ")), float(input("Enter the longitude: ")))
#print(f"The point {input_point} is inside the polygon: {find_polygon(polygons, input_point)}")
#print(f"This is {find_polygon(polygons, input_point)} shot")
