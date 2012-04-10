CREATE TABLE IF NOT EXISTS `ania_en_pl` (
  `head` varchar(128) NOT NULL,
  `definition` text,
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`),
  KEY `head` (`head`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 AUTO_INCREMENT=0 ;